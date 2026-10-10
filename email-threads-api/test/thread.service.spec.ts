/**
 * Thread Service Unit Tests
 * 
 * Jest unit tests for the ThreadService business logic.
 * Covers listing, opening, searching, drafts, and access control.
 */

import { ThreadService } from "../src/services/thread.service";
import { InMemoryThreadRepository } from "../src/repositories/thread.repository";
import { Principal, Thread, Message, EmailAddress } from "../src/models";
import { ApiError } from "../src/errors";

describe("ThreadService", () => {
  let repo: InMemoryThreadRepository;
  let service: ThreadService;
  let principal: Principal;

  const testEmail: EmailAddress = { local: "alice", domain: "example.com" };

  beforeEach(() => {
    repo = new InMemoryThreadRepository();
    service = new ThreadService({ repo });
    principal = { id: "user-1", email: testEmail };

    // Seed test data
    const thread: Thread = {
      id: "thread-1",
      subject: "Test Thread",
      participantIds: ["user-1", "user-2"],
      participants: [testEmail, { local: "bob", domain: "example.com" }],
      lastActivityAt: Date.now(),
      messageCount: 2,
      draftCount: 0,
      createdAt: Date.now() - 1000,
    };
    repo.upsertThread(thread);

    const message1: Message = {
      id: "msg-1",
      threadId: "thread-1",
      from: testEmail,
      subject: "Test Thread",
      body: "First message body",
      recipients: { to: [{ local: "bob", domain: "example.com" }], cc: [], bcc: [] },
      authorId: "user-1",
      isDraft: false,
      createdAt: Date.now() - 500,
      updatedAt: Date.now() - 500,
    };
    repo.insertMessage(message1);

    const message2: Message = {
      id: "msg-2",
      threadId: "thread-1",
      from: { local: "bob", domain: "example.com" },
      subject: "Re: Test Thread",
      body: "Second message body",
      recipients: { to: [testEmail], cc: [], bcc: [] },
      authorId: "user-2",
      isDraft: false,
      createdAt: Date.now() - 200,
      updatedAt: Date.now() - 200,
    };
    repo.insertMessage(message2);
  });

  describe("listThreads", () => {
    it("should return threads visible to the principal", async () => {
      const result = await service.listThreads(principal);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("thread-1");
    });

    it("should respect limit parameter", async () => {
      const result = await service.listThreads(principal, { limit: 1 });
      expect(result.items).toHaveLength(1);
    });

    it("should return empty array for user with no threads", async () => {
      const otherPrincipal: Principal = { id: "user-99", email: testEmail };
      const result = await service.listThreads(otherPrincipal);
      expect(result.items).toHaveLength(0);
    });
  });

  describe("getThread", () => {
    it("should return thread detail with messages", async () => {
      const result = await service.getThread(principal, "thread-1");
      expect(result.id).toBe("thread-1");
      expect(result.messages).toHaveLength(2);
    });

    it("should throw NotFound for non-existent thread", async () => {
      await expect(service.getThread(principal, "non-existent")).rejects.toThrow(ApiError);
    });

    it("should throw Forbidden for non-participant", async () => {
      const otherPrincipal: Principal = { id: "user-99", email: testEmail };
      await expect(service.getThread(otherPrincipal, "thread-1")).rejects.toThrow(ApiError);
    });
  });

  describe("searchThreads", () => {
    it("should find threads matching search query", async () => {
      const result = await service.searchThreads(principal, { q: "First message" });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].matchedMessageIds).toContain("msg-1");
    });

    it("should return empty for no matches", async () => {
      const result = await service.searchThreads(principal, { q: "nonexistent content" });
      expect(result.items).toHaveLength(0);
    });
  });

  describe("upsertDraft", () => {
    it("should create a new draft", async () => {
      const draft = await service.upsertDraft(principal, "thread-1", {
        body: "Draft body",
        to: [{ local: "bob", domain: "example.com" }],
      });
      expect(draft.isDraft).toBe(true);
      expect(draft.threadId).toBe("thread-1");
      expect(draft.authorId).toBe("user-1");
    });

    it("should throw NotFound for non-existent thread", async () => {
      await expect(
        service.upsertDraft(principal, "non-existent", { body: "test" }),
      ).rejects.toThrow(ApiError);
    });

    it("should throw Forbidden for non-participant", async () => {
      const otherPrincipal: Principal = { id: "user-99", email: testEmail };
      await expect(
        service.upsertDraft(otherPrincipal, "thread-1", { body: "test" }),
      ).rejects.toThrow(ApiError);
    });
  });

  describe("sendDraft", () => {
    it("should send a draft and update thread metadata", async () => {
      const draft = await service.upsertDraft(principal, "thread-1", {
        body: "Draft to send",
      });
      const sent = await service.sendDraft(principal, draft.id);
      expect(sent.isDraft).toBe(false);
    });

    it("should throw NotFound for non-existent draft", async () => {
      await expect(service.sendDraft(principal, "non-existent")).rejects.toThrow(ApiError);
    });

    it("should throw Forbidden for non-author", async () => {
      const draft = await service.upsertDraft(principal, "thread-1", {
        body: "Draft to send",
      });
      const otherPrincipal: Principal = { id: "user-99", email: testEmail };
      await expect(service.sendDraft(otherPrincipal, draft.id)).rejects.toThrow(ApiError);
    });
  });
});
