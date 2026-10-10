/**
 * Prisma Seed Script
 * 
 * Seeds the database with test data for development and testing.
 * Run with: npm run prisma:seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.message.deleteMany();
  await prisma.token.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const alice = await prisma.user.create({
    data: {
      id: "user-alice",
      emailLocal: "alice",
      emailDomain: "example.com",
      name: "Alice Smith",
    },
  });

  const bob = await prisma.user.create({
    data: {
      id: "user-bob",
      emailLocal: "bob",
      emailDomain: "example.com",
      name: "Bob Jones",
    },
  });

  // Create tokens
  await prisma.token.create({
    data: { token: "test-token-alice", userId: alice.id },
  });
  await prisma.token.create({
    data: { token: "test-token-bob", userId: bob.id },
  });

  // Create a thread
  const thread = await prisma.thread.create({
    data: {
      id: "thread-demo",
      subject: "Welcome to Email Threads API",
      participantIds: [alice.id, bob.id],
      participants: [
        { local: "alice", domain: "example.com", name: "Alice Smith" },
        { local: "bob", domain: "example.com", name: "Bob Jones" },
      ],
      lastActivityAt: new Date(),
      messageCount: 2,
      draftCount: 0,
    },
  });

  // Create messages
  await prisma.message.create({
    data: {
      id: "msg-1",
      threadId: thread.id,
      authorId: alice.id,
      fromLocal: "alice",
      fromDomain: "example.com",
      fromName: "Alice Smith",
      subject: "Welcome to Email Threads API",
      body: "Hi Bob! Welcome to the new Email Threads API. This is the first message in our conversation thread.",
      recipients: {
        to: [{ local: "bob", domain: "example.com", name: "Bob Jones" }],
        cc: [],
        bcc: [],
      },
      isDraft: false,
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(Date.now() - 3600000),
    },
  });

  await prisma.message.create({
    data: {
      id: "msg-2",
      threadId: thread.id,
      authorId: bob.id,
      fromLocal: "bob",
      fromDomain: "example.com",
      fromName: "Bob Jones",
      subject: "Re: Welcome to Email Threads API",
      body: "Thanks Alice! This thread-based approach is much better than isolated messages. I can see the full conversation context.",
      recipients: {
        to: [{ local: "alice", domain: "example.com", name: "Alice Smith" }],
        cc: [],
        bcc: [],
      },
      isDraft: false,
      createdAt: new Date(Date.now() - 1800000),
      updatedAt: new Date(Date.now() - 1800000),
    },
  });

  console.log("Seed completed!");
  console.log("Users: alice (test-token-alice), bob (test-token-bob)");
  console.log("Thread: thread-demo with 2 messages");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
