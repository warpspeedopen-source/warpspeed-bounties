/**
 * Domain Models for Email Threads API
 * 
 * Contains all TypeScript interfaces, types, and helper functions
 * for the email threading domain.
 */

// RFC-5322-ish email address.
export interface EmailAddress {
  /** Local-part of the address, e.g. "alice". */
  local: string;
  /** Domain part, e.g. "example.com". */
  domain: string;
  /** Optional display name. */
  name?: string;
}

/** Canonical string form of an EmailAddress. */
export const formatAddress = (a: EmailAddress): string =>
  a.name ? `"${a.name}" <${a.local}@${a.domain}>` : `${a.local}@${a.domain}`;

/** Parse a "Name <local@domain>" or "local@domain" string into an EmailAddress. */
export const parseAddress = (raw: string): EmailAddress => {
  const named = raw.match(/^"?(.*?)"?\s*<([^>@]+)@([^>@]+)>$/);
  if (named) {
    return { name: named[1] || undefined, local: named[2], domain: named[3] };
  }
  const bare = raw.match(/^([^@]+)@([^@]+)$/);
  if (bare) return { local: bare[1], domain: bare[2] };
  throw new Error(`Invalid email address: ${raw}`);
};

/** Visibility / role of a recipient on a message. */
export type RecipientRole = "to" | "cc" | "bcc";

/** A single email message — either a sent/received item or a draft. */
export interface Message {
  /** Globally unique message id. */
  id: string;
  /** Owning thread id (conversation). */
  threadId: string;
  /** Author address. */
  from: EmailAddress;
  /** Subject line. */
  subject: string;
  /** Plain-text body (HTML is intentionally out of scope for bounty). */
  body: string;
  /** Recipients grouped by role. */
  recipients: Record<RecipientRole, EmailAddress[]>;
  /** Author user id of the message (sender). */
  authorId: string;
  /** True if this message is a draft. */
  isDraft: boolean;
  /** Creation timestamp (epoch ms). */
  createdAt: number;
  /** Last update timestamp (epoch ms). */
  updatedAt: number;
}

/** A draft always belongs to its author and a thread. */
export interface Draft extends Message {
  isDraft: true;
  /** Thread the draft will join on send. */
  threadId: string;
}

/** Conversation metadata visible to participants. */
export interface Thread {
  /** Globally unique thread id. */
  id: string;
  /** Canonical subject (Re:/Fwd: prefixes stripped for grouping). */
  subject: string;
  /** User ids that may view this thread. */
  participantIds: string[];
  /** All addresses that have appeared on the thread. */
  participants: EmailAddress[];
  /** Most recent activity timestamp (epoch ms). */
  lastActivityAt: number;
  /** Count of *non-draft* messages. */
  messageCount: number;
  /** Count of drafts currently attached. */
  draftCount: number;
  /** Creation timestamp (epoch ms). */
  createdAt: number;
}

/** Compact summary returned in list & search responses. */
export interface ThreadSummary {
  id: string;
  subject: string;
  participants: EmailAddress[];
  lastActivityAt: number;
  messageCount: number;
  draftCount: number;
  /** Snippet from the latest non-draft message (truncated). */
  snippet: string;
  /** Whether the authenticated user has any draft on this thread. */
  hasOwnDraft: boolean;
  /** Ids of messages that matched a search (omitted when no search). */
  matchedMessageIds?: string[];
}

/** Full thread payload returned by `GET /threads/:id`. */
export interface ThreadDetail extends Thread {
  messages: Message[];
}

/** Authenticated user principal attached to each request. */
export interface Principal {
  id: string;
  email: EmailAddress;
}

/** Search/filter query string parameters. */
export interface SearchQuery {
  q?: string;
  from?: string;
  to?: string;
  subject?: string;
  hasDraft?: boolean;
  since?: number;
  until?: number;
  limit?: number;
  cursor?: string;
}

/** Clamp a number between min and max. */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);
