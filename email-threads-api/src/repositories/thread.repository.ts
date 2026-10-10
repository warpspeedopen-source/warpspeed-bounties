/**
 * Thread Repository - Data Access Layer
 * 
 * Interface and in-memory implementation for thread/message persistence.
 * Replace with a Postgres/Prisma-backed adapter for production.
 */

import { Thread, Message, Principal } from "../models";

export interface ThreadRepository {
  // Threads
  getThread(id: string): Promise<Thread | null>;
  upsertThread(thread: Thread): Promise<Thread>;
  listThreadsForUser(userId: string): Promise<Thread[]>;

  // Messages
  getMessage(id: string): Promise<Message | null>;
  listMessagesByThread(threadId: string): Promise<Message[]>;
  listMessagesByAuthor(authorId: string): Promise<Message[]>;
  insertMessage(message: Message): Promise<Message>;
  updateMessage(message: Message): Promise<Message>;

  // Users
  getUserByToken(token: string): Promise<Principal | null>;
  getUserById(id: string): Promise<Principal | null>;
  upsertUser(user: Principal): Promise<Principal>;
}

/**
 * In-memory repository — sufficient for bounty validation and tests.
 * Replace with a Postgres-backed adapter that satisfies the same interface.
 */
export class InMemoryThreadRepository implements ThreadRepository {
  private threads = new Map<string, Thread>();
  private messages = new Map<string, Message>();
  private users = new Map<string, Principal>();
  private tokens = new Map<string, string>(); // token -> userId

  // --- Threads -----------------------------------------------------------
  async getThread(id: string): Promise<Thread | null> {
    return this.threads.get(id) ?? null;
  }

  async upsertThread(thread: Thread): Promise<Thread> {
    this.threads.set(thread.id, thread);
    return thread;
  }

  async listThreadsForUser(userId: string): Promise<Thread[]> {
    return Array.from(this.threads.values()).filter((t) =>
      t.participantIds.includes(userId),
    );
  }

  // --- Messages ----------------------------------------------------------
  async getMessage(id: string): Promise<Message | null> {
    return this.messages.get(id) ?? null;
  }

  async listMessagesByThread(threadId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((m) => m.threadId === threadId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async listMessagesByAuthor(authorId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((m) => m.authorId === authorId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async insertMessage(message: Message): Promise<Message> {
    if (this.messages.has(message.id))
      throw new Error(`duplicate message id ${message.id}`);
    this.messages.set(message.id, message);
    return message;
  }

  async updateMessage(message: Message): Promise<Message> {
    this.messages.set(message.id, message);
    return message;
  }

  // --- Users -------------------------------------------------------------
  async getUserByToken(token: string): Promise<Principal | null> {
    const userId = this.tokens.get(token);
    return userId ? (this.users.get(userId) ?? null) : null;
  }

  async getUserById(id: string): Promise<Principal | null> {
    return this.users.get(id) ?? null;
  }

  async upsertUser(user: Principal): Promise<Principal> {
    this.users.set(user.id, user);
    return user;
  }

  // --- Test helpers ------------------------------------------------------
  /** Issue a stable token for the given user. Used by tests and seeders. */
  issueToken(userId: string, token: string): void {
    this.tokens.set(token, userId);
  }

  /** Reset the entire store. Useful in test setup. */
  reset(): void {
    this.threads.clear();
    this.messages.clear();
    this.users.clear();
    this.tokens.clear();
  }
}
