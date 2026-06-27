import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import type { ThreadListQuery } from '../schemas.js';

export interface ThreadListResult {
  threads: Array<{
    id: string;
    subject: string;
    snippet: string | null;
    isRead: boolean;
    isStarred: boolean;
    category: string;
    priority: string;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
    lastMessageFrom: string;
    labels: Array<{ id: string; name: string; color: string }>;
    tags: Array<{ id: string; name: string; color: string }>;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listThreads(query: ThreadListQuery): Promise<ThreadListResult> {
  const where: Prisma.EmailThreadWhereInput = {};

  if (query.category) {
    where.category = query.category;
  }
  if (query.priority) {
    where.priority = query.priority;
  }
  if (query.isRead !== undefined) {
    where.isRead = query.isRead;
  }
  if (query.isStarred !== undefined) {
    where.isStarred = query.isStarred;
  }
  if (query.search) {
    where.OR = [
      { subject: { contains: query.search, mode: 'insensitive' } },
      { snippet: { contains: query.search, mode: 'insensitive' } },
      { messages: { some: { body: { contains: query.search, mode: 'insensitive' } } } },
    ];
  }
  if (query.label) {
    where.labels = { some: { name: query.label } };
  }
  if (query.tag) {
    where.tags = { some: { name: query.tag } };
  }

  const [threads, total] = await Promise.all([
    prisma.emailThread.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { fromName: true, createdAt: true },
        },
        labels: { select: { id: true, name: true, color: true } },
        tags: { select: { id: true, name: true, color: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.emailThread.count({ where }),
  ]);

  return {
    threads: threads.map((t) => ({
      id: t.id,
      subject: t.subject,
      snippet: t.snippet,
      isRead: t.isRead,
      isStarred: t.isStarred,
      category: t.category,
      priority: t.priority,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      messageCount: t._count.messages,
      lastMessageFrom: t.messages[0]?.fromName ?? '',
      labels: t.labels,
      tags: t.tags,
    })),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function getThreadById(id: string) {
  const thread = await prisma.emailThread.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      labels: { select: { id: true, name: true, color: true } },
      tags: { select: { id: true, name: true, color: true } },
    },
  });
  return thread;
}
