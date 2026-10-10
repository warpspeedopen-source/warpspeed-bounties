/**
 * Repository Layer Exports
 * 
 * Data access layer for the Email Threads API.
 * Supports both in-memory (for testing/dev) and Prisma/PostgreSQL (for production).
 */

export { ThreadRepository, InMemoryThreadRepository } from "./thread.repository";
export { PrismaThreadRepository } from "./prisma-thread.repository";
