/**
 * Thread Service - Business Logic Layer
 * 
 * Core business logic for email threading operations.
 * Handles listing, opening, searching, drafts, and access control.
 */

import { randomUUID } from "crypto";
import {
  Thread,
  Message,
  Draft,
  ThreadSummary,
  ThreadDetail,
  Principal,
  SearchQuery,
  EmailAddress,
  formatAddress,
  clamp,
} from "../models";
import { NotFound, Forbidden, BadRequest } from "../errors";
import { ThreadRepository } from "../repositories/thread.repository";

const SUBJECT_PREFIX_RE = /^\s*(re|fwd|fw)\s*:\s*/i;

/** Strip Re:/Fwd: prefixes so messages with the same canonical subject group. */
export const canonicalSubject = (raw: string): string => {
  let s = raw.trim();
  let safety = 8;
  while (SUBJECT_PREFIX_RE.test(s) && safety-- > 0) {
    s = s.replace(SUBJECT_PREFIX_RE, "");
  }
  return s;
};

export interface ThreadServiceDeps {
  repo: ThreadRepository;
  clock?: () => number;
  snippetLength?: number;
}

export class ThreadService {
  private readonly repo: ThreadRepository;
  private readonly now: () => number;
  private readonly snippetLength: number;

  constructor(deps: ThreadServiceDeps) {
    this.repo = deps.repo;
    this.now = deps.clock ?? (() => Date.now());
    this.snippetLength = deps.snippetLength ?? 140;
  }

  // ---------- Listing ----------

  /**
   * List all threads visible to the principal, sorted by lastActivityAt desc.
   * Honors `limit` & `cursor` for pagination.
   */
  async listThreads(
    principal: Principal,
    opts: { limit?: number; cursor?: string } = {},
  ): Promise<{ items: ThreadSummary[]; nextCursor?: string }> {
    const limit = clamp(opts.limit ?? 25, 1, 100);
    const all = (await this.repo.listThreadsForUser(principal.id)).sort(
      (a, b) => b.lastActivityAt - a.lastActivityAt,
    );
    const startIdx = opts.cursor
      ? Number(Buffer.from(opts.cursor, "base64").toString("utf8")) || 0
      : 0;
    const slice = all.slice(startIdx, startIdx + limit);
    const items = await Promise.all(slice.map((t) => this.toSummary(t, principal.id)));
    const nextCursor =
      startIdx + limit < all.length
        ? Buffer.from(String(startIdx + limit)).toString("base64")
        : undefined;
    return { items, nextCursor };
  }

  // ---------- Opening ----------

  /**
   * Open a single thread. Enforces ownership: principal.id must be in
   * thread.participantIds. Drafts are included in `messages` in chronological
   * order, but only drafts authored by the principal are returned (drafts are
   * private to their author).
   */
  async getThread(principal: Principal, threadId: string): Promise<ThreadDetail> {
    const thread = await this.repo.getThread(threadId);
    if (!thread) throw NotFound("thread");
    if (!thread.participantIds.includes(principal.id))
      throw Forbidden("not a thread participant");
    const messages = await this.repo.listMessagesByThread(threadId);
    const visible = messages
      .filter((m) => !m.isDraft || m.authorId === principal.id)
      .map((m) => ({ ...m }));
    return { ...thread, messages: visible };
  }

  // ---------- Search / Filter with grouping ----------

  /**
   * Search messages matching the query and group results by thread.
   * Each returned summary contains the matching message ids so the client can
   * highlight them on open. Pagination uses an opaque cursor over the
   * aggregated result set.
   */
  async searchThreads(
    principal: Principal,
    query: SearchQuery,
  ): Promise<{ items: ThreadSummary[]; nextCursor?: string }> {
    const limit = clamp(query.limit ?? 25, 1, 100);
    const userThreads = await this.repo.listThreadsForUser(principal.id);
    const userThreadIds = new Set(userThreads.map((t) => t.id));

    // Pull all messages on visible threads (in-memory store); real DB would
    // push filtering down via SQL. We still partition *before* joining.
    const candidateMessages: Message[] = [];
    for (const t of userThreads) {
      const ms = await this.repo.listMessagesByThread(t.id);
      candidateMessages.push(...ms);
    }

    const matches = candidateMessages.filter((m) => {
      // Drafts are visible only to their author.
      if (m.isDraft && m.authorId !== principal.id) return false;
      if (!userThreadIds.has(m.threadId)) return false;
      if (query.q && !this.matchesText(m, query.q)) return false;
      if (query.from && formatAddress(m.from).toLowerCase() !== query.from.toLowerCase())
        return false;
      const toFilter = query.to;
      if (
        toFilter &&
        !this.messageAddressesTo(m).some(
          (a) => formatAddress(a).toLowerCase() === toFilter.toLowerCase(),
        )
      )
        return false;
      if (query.subject && !m.subject.toLowerCase().includes(query.subject.toLowerCase()))
        return false;
      if (query.since && m.createdAt < query.since) return false;
      if (query.until && m.createdAt > query.until) return false;
      return true;
    });

    // Group by thread.
    const byThread = new Map<string, Message[]>();
    for (const m of matches) {
      const arr = byThread.get(m.threadId);
      if (arr) arr.push(m);
      else byThread.set(m.threadId, [m]);
    }

    let threadsToReturn = Array.from(byThread.keys())
      .map((id) => userThreads.find((t) => t.id === id)!)
      .filter(Boolean)
      .sort((a, b) => b.lastActivityAt - a.lastActivityAt);

    // Optional post-filter for "hasDraft" — drafts are visible only to author.
    if (query.hasDraft) {
      const filtered: Thread[] = [];
      for (const t of threadsToReturn) {
        const ms = byThread.get(t.id)!;
        if (ms.some((m) => m.isDraft && m.authorId === principal.id)) {
          filtered.push(t);
        }
      }
      threadsToReturn = filtered;
    }

    const startIdx = query.cursor
      ? Number(Buffer.from(query.cursor, "base64").toString("utf8")) || 0
      : 0;
    const slice = threadsToReturn.slice(startIdx, startIdx + limit);

    const items = await Promise.all(
      slice.map(async (t) => {
        const summary = await this.toSummary(t, principal.id);
        summary.matchedMessageIds = (byThread.get(t.id) ?? []).map((m) => m.id);
        return summary;
      }),
    );

    const nextCursor =
      startIdx + limit < threadsToReturn.length
        ? Buffer.from(String(startIdx + limit)).toString("base64")
        : undefined;

    return { items, nextCursor };
  }

  // ---------- Drafts ----------

  /**
   * Create or update a draft attached to a thread.
   * Drafts are private to their author; they DO NOT add a new participant
   * to the thread. They DO appear in `getThread` results for the author.
   */
  async upsertDraft(
    principal: Principal,
    threadId: string,
    draft: {
      id?: string;
      subject?: string;
      body: string;
      to?: EmailAddress[];
      cc?: EmailAddress[];
      bcc?: EmailAddress[];
    },
  ): Promise<Message> {
    const thread = await this.repo.getThread(threadId);
    if (!thread) throw NotFound("thread");
    if (!thread.participantIds.includes(principal.id)) {
      throw Forbidden("not a thread participant");
    }
    const now = this.now();
    const existing = draft.id ? await this.repo.getMessage(draft.id) : null;

    if (existing) {
      if (existing.isDraft === false) throw BadRequest("cannot edit a sent message");
      if (existing.authorId !== principal.id) throw Forbidden("not your draft");
      existing.subject = draft.subject ?? existing.subject;
      existing.body = draft.body;
      existing.recipients = {
        to: draft.to ?? existing.recipients.to,
        cc: draft.cc ?? existing.recipients.cc,
        bcc: draft.bcc ?? existing.recipients.bcc,
      };
      existing.updatedAt = now;
      return await this.repo.updateMessage(existing);
    }

    const message: Draft = {
      id: draft.id ?? randomUUID(),
      threadId,
      from: principal.email,
      subject: draft.subject ?? thread.subject,
      body: draft.body,
      recipients: {
        to: draft.to ?? [],
        cc: draft.cc ?? [],
        bcc: draft.bcc ?? [],
      },
      authorId: principal.id,
      isDraft: true,
      createdAt: now,
      updatedAt: now,
    };
    const inserted = await this.repo.insertMessage(message);
    // Drafts do NOT mutate thread.lastActivityAt for other participants, but
    // they DO bump a private counter visible only to the author via toSummary.
    return inserted;
  }

  /**
   * Send a previously saved draft. Promotes it to a real message, mutates the
   * thread's lastActivityAt and messageCount, and (if new recipients are
   * introduced) expands thread.participants.
   */
  async sendDraft(principal: Principal, draftId: string): Promise<Message> {
    const draft = await this.repo.getMessage(draftId);
    if (!draft || !draft.isDraft) throw NotFound("draft");
    if (draft.authorId !== principal.id) throw Forbidden("not your draft");
    const thread = await this.repo.getThread(draft.threadId);
    if (!thread) throw NotFound("thread");

    const now = this.now();
    const sent: Message = { ...draft, isDraft: false, updatedAt: now };
    await this.repo.updateMessage(sent);

    // Update thread metadata.
    const recipients = [
      ...sent.recipients.to,
      ...sent.recipients.cc,
      ...sent.recipients.bcc,
    ];
    thread.lastActivityAt = now;
    thread.messageCount += 1;
    thread.draftCount = Math.max(0, thread.draftCount - 1);
    await this.repo.upsertThread(thread);

    return sent;
  }

  // ---------- Internal helpers ----------

  /** Convert a Thread to a ThreadSummary with snippet and draft info. */
  private async toSummary(thread: Thread, principalId: string): Promise<ThreadSummary> {
    const messages = await this.repo.listMessagesByThread(thread.id);
    const nonDrafts = messages.filter((m) => !m.isDraft);
    const latest = nonDrafts[nonDrafts.length - 1];
    const ownDrafts = messages.filter((m) => m.isDraft && m.authorId === principalId);

    return {
      id: thread.id,
      subject: thread.subject,
      participants: thread.participants,
      lastActivityAt: thread.lastActivityAt,
      messageCount: thread.messageCount,
      draftCount: thread.draftCount,
      snippet: latest ? latest.body.slice(0, this.snippetLength) : "",
      hasOwnDraft: ownDrafts.length > 0,
    };
  }

  /** Check if a message matches a full-text search query. */
  private matchesText(message: Message, query: string): boolean {
    const q = query.toLowerCase();
    return (
      message.subject.toLowerCase().includes(q) ||
      message.body.toLowerCase().includes(q) ||
      formatAddress(message.from).toLowerCase().includes(q)
    );
  }

  /** Get all "to" recipients from a message. */
  private messageAddressesTo(message: Message): EmailAddress[] {
    return [...message.recipients.to];
  }
}
