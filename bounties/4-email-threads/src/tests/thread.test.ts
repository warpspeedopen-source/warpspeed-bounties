import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { ThreadService } from "../services/threadService.js";
import { EmailMessage } from "../types/index.js";

describe("Email Threads API Business Logic", () => {
  const service = ThreadService.getInstance();
  const userId = "usr_123";

  const mockMessages: EmailMessage[] = [
    {
      id: "msg_1",
      threadId: "thread_A",
      sender: "client@example.com",
      recipients: ["usr_123@example.com"],
      subject: "Project proposal details",
      body: "Please check our attached proposal.",
      timestamp: new Date("2026-05-31T10:00:00Z"),
      isDraft: false,
      isArchived: false,
      isDeleted: false,
      userId: userId,
      provider: "gmail"
    },
    {
      id: "msg_2",
      threadId: "thread_A",
      sender: "usr_123@example.com",
      recipients: ["client@example.com"],
      subject: "Project proposal details",
      body: "Thanks! Will review.",
      timestamp: new Date("2026-05-31T11:00:00Z"),
      isDraft: false,
      isArchived: false,
      isDeleted: false,
      userId: userId,
      provider: "gmail"
    },
    {
      id: "msg_3",
      threadId: "thread_B",
      sender: "system@example.com",
      recipients: ["usr_123@example.com"],
      subject: "Server alert warning",
      body: "Memory usage exceeded 90%.",
      timestamp: new Date("2026-05-31T12:00:00Z"),
      isDraft: false,
      isArchived: false,
      isDeleted: false,
      userId: userId,
      provider: "outlook"
    },
    {
      id: "msg_4_deleted",
      threadId: "thread_A",
      sender: "client@example.com",
      recipients: ["usr_123@example.com"],
      subject: "Project proposal details",
      body: "Spam message deleted.",
      timestamp: new Date("2026-05-31T11:30:00Z"),
      isDraft: false,
      isArchived: false,
      isDeleted: true, // should be excluded
      userId: userId,
      provider: "gmail"
    }
  ];

  before(() => {
    service.seedMessages(mockMessages);
  });

  test("Groups messages into correct threads and excludes deleted messages", async () => {
    const threads = await service.listThreads(userId);
    
    // There should be 2 active threads
    assert.equal(threads.length, 2);

    const threadA = threads.find(t => t.id === "thread_A");
    assert.ok(threadA);
    assert.equal(threadA.messageCount, 2); // msg_1 and msg_2 (excluding msg_4_deleted)
    assert.equal(threadA.messages[0].id, "msg_1");
    assert.equal(threadA.messages[1].id, "msg_2");
  });

  test("Sorts threads by recency correctly", async () => {
    const threads = await service.listThreads(userId);

    // thread_B last message was 12:00:00
    // thread_A last message was 11:00:00
    // So thread_B must come first
    assert.equal(threads[0].id, "thread_B");
    assert.equal(threads[1].id, "thread_A");
  });

  test("Supports search filtering", async () => {
    const threads = await service.listThreads(userId, { search: "proposal" });
    assert.equal(threads.length, 1);
    assert.equal(threads[0].id, "thread_A");
  });

  test("Supports provider filtering", async () => {
    const outlookThreads = await service.listThreads(userId, { provider: "outlook" });
    assert.equal(outlookThreads.length, 1);
    assert.equal(outlookThreads[0].id, "thread_B");
  });

  test("Maintains draft updates and shifts thread recency to top", async () => {
    // 1. Create a draft in thread_A
    await service.createOrUpdateDraft(userId, "thread_A", {
      body: "This is a draft reply",
      sender: "usr_123@example.com",
      recipients: ["client@example.com"],
      subject: "Project proposal details"
    });

    const threads = await service.listThreads(userId, { includeDrafts: true });
    
    // Now, thread_A last message timestamp was updated to current time, so thread_A should be at the top!
    assert.equal(threads[0].id, "thread_A");
    assert.equal(threads[0].hasDrafts, true);
  });
});
