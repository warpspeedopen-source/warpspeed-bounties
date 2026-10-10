/**
 * Prisma Thread Repository - PostgreSQL Data Access Layer
 * 
 * Prisma-backed implementation of ThreadRepository for production use.
 * Requires a PostgreSQL database and DATABASE_URL environment variable.
 * 
 * Usage:
 *   import { PrismaClient } from "@prisma/client";
 *   const prisma = new PrismaClient();
 *   const repo = new PrismaThreadRepository(prisma);
 */

import { PrismaClient } from "@prisma/client";
import { Thread, Message, Principal, EmailAddress } from "../models";
import { ThreadRepository } from "./thread.repository";

export class PrismaThreadRepository implements ThreadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // --- Threads -----------------------------------------------------------

  async getThread(id: string): Promise<Thread | null> {
    const thread = await this.prisma.thread.findUnique({
      where: { id },
    });
    return thread ? this.mapThread(thread) : null;
  }

  async upsertThread(thread: Thread): Promise<Thread> {
    const saved = await this.prisma.thread.upsert({
      where: { id: thread.id },
      create: {
        id: thread.id,
        subject: thread.subject,
        participantIds: thread.participantIds,
        participants: thread.participants as unknown as object,
        lastActivityAt: new Date(thread.lastActivityAt),
        messageCount: thread.messageCount,
        draftCount: thread.draftCount,
        createdAt: new Date(thread.createdAt),
      },
      update: {
        subject: thread.subject,
        participantIds: thread.participantIds,
        participants: thread.participants as unknown as object,
        lastActivityAt: new Date(thread.lastActivityAt),
        messageCount: thread.messageCount,
        draftCount: thread.draftCount,
      },
    });
    return this.mapThread(saved);
  }

  async listThreadsForUser(userId: string): Promise<Thread[]> {
    const threads = await this.prisma.thread.findMany({
      where: {
        participantIds: {
          has: userId,
        },
      },
      orderBy: { lastActivityAt: "desc" },
    });
    return threads.map((t) => this.mapThread(t));
  }

  // --- Messages ----------------------------------------------------------

  async getMessage(id: string): Promise<Message | null> {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });
    return message ? this.mapMessage(message) : null;
  }

  async listMessagesByThread(threadId: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
    });
    return messages.map((m) => this.mapMessage(m));
  }

  async listMessagesByAuthor(authorId: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { authorId },
      orderBy: { createdAt: "asc" },
    });
    return messages.map((m) => this.mapMessage(m));
  }

  async insertMessage(message: Message): Promise<Message> {
    const created = await this.prisma.message.create({
      data: {
        id: message.id,
        threadId: message.threadId,
        authorId: message.authorId,
        fromLocal: message.from.local,
        fromDomain: message.from.domain,
        fromName: message.from.name,
        subject: message.subject,
        body: message.body,
        recipients: message.recipients as unknown as object,
        isDraft: message.isDraft,
        createdAt: new Date(message.createdAt),
        updatedAt: new Date(message.updatedAt),
      },
    });
    return this.mapMessage(created);
  }

  async updateMessage(message: Message): Promise<Message> {
    const updated = await this.prisma.message.update({
      where: { id: message.id },
      data: {
        threadId: message.threadId,
        authorId: message.authorId,
        fromLocal: message.from.local,
        fromDomain: message.from.domain,
        fromName: message.from.name,
        subject: message.subject,
        body: message.body,
        recipients: message.recipients as unknown as object,
        isDraft: message.isDraft,
        updatedAt: new Date(message.updatedAt),
      },
    });
    return this.mapMessage(updated);
  }

  // --- Users -------------------------------------------------------------

  async getUserByToken(token: string): Promise<Principal | null> {
    const tokenRecord = await this.prisma.token.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!tokenRecord) return null;
    return this.mapPrincipal(tokenRecord.user);
  }

  async getUserById(id: string): Promise<Principal | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? this.mapPrincipal(user) : null;
  }

  async upsertUser(user: Principal): Promise<Principal> {
    const saved = await this.prisma.user.upsert({
      where: {
        emailLocal_emailDomain: {
          emailLocal: user.email.local,
          emailDomain: user.email.domain,
        },
      },
      create: {
        id: user.id,
        emailLocal: user.email.local,
        emailDomain: user.email.domain,
        name: user.email.name,
      },
      update: {
        name: user.email.name,
      },
    });
    return this.mapPrincipal(saved);
  }

  // --- Test helpers ------------------------------------------------------

  /** Issue a stable token for the given user. Used by tests and seeders. */
  async issueToken(userId: string, token: string): Promise<void> {
    await this.prisma.token.upsert({
      where: { token },
      create: { token, userId },
      update: { userId },
    });
  }

  /** Reset the entire store. Useful in test setup. */
  async reset(): Promise<void> {
    await this.prisma.message.deleteMany();
    await this.prisma.token.deleteMany();
    await this.prisma.thread.deleteMany();
    await this.prisma.user.deleteMany();
  }

  // --- Mapping helpers ---------------------------------------------------

  private mapThread(prismaThread: {
    id: string;
    subject: string;
    participantIds: string[];
    participants: unknown;
    lastActivityAt: Date;
    messageCount: number;
    draftCount: number;
    createdAt: Date;
  }): Thread {
    return {
      id: prismaThread.id,
      subject: prismaThread.subject,
      participantIds: prismaThread.participantIds,
      participants: prismaThread.participants as EmailAddress[],
      lastActivityAt: prismaThread.lastActivityAt.getTime(),
      messageCount: prismaThread.messageCount,
      draftCount: prismaThread.draftCount,
      createdAt: prismaThread.createdAt.getTime(),
    };
  }

  private mapMessage(prismaMessage: {
    id: string;
    threadId: string;
    authorId: string;
    fromLocal: string;
    fromDomain: string;
    fromName: string | null;
    subject: string;
    body: string;
    recipients: unknown;
    isDraft: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Message {
    return {
      id: prismaMessage.id,
      threadId: prismaMessage.threadId,
      from: {
        local: prismaMessage.fromLocal,
        domain: prismaMessage.fromDomain,
        name: prismaMessage.fromName ?? undefined,
      },
      subject: prismaMessage.subject,
      body: prismaMessage.body,
      recipients: prismaMessage.recipients as Message["recipients"],
      authorId: prismaMessage.authorId,
      isDraft: prismaMessage.isDraft,
      createdAt: prismaMessage.createdAt.getTime(),
      updatedAt: prismaMessage.updatedAt.getTime(),
    };
  }

  private mapPrincipal(prismaUser: {
    id: string;
    emailLocal: string;
    emailDomain: string;
    name: string | null;
  }): Principal {
    return {
      id: prismaUser.id,
      email: {
        local: prismaUser.emailLocal,
        domain: prismaUser.emailDomain,
        name: prismaUser.name ?? undefined,
      },
    };
  }
}
