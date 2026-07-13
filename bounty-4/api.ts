import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { v4 as uuid } from 'uuid'
import {
  EmailThread,
  EmailMessage,
  ThreadParticipant,
  PaginatedResponse,
  ThreadDetailResponse,
  SentMessageResponse,
  ListThreadsParams,
  ReplyRequest,
  CreateThreadRequest,
  ApiError,
} from './types'

const prisma = new PrismaClient()
const router = Router()

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function currentUserId(req: Request): string {
  return req.user!.id
}

function apiError(status: number, error: string, message: string, details?: ApiError['details']): { status: number; body: ApiError } {
  return { status, body: { error, message, details } }
}

function paginated<T>(
  data: T[],
  page: number,
  limit: number,
  totalItems: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalItems / limit)
  return {
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

function mapPrismaThread(thread: any): EmailThread {
  return {
    id: thread.id,
    subject: thread.subject,
    participants: thread.participants.map((p: any) => ({
      name: p.name,
      email: p.email,
      role: p.role as ThreadParticipant['role'],
    })),
    lastMessageAt: thread.lastMessageAt.toISOString(),
    createdAt: thread.createdAt.toISOString(),
    messageCount: thread._count?.messages ?? thread.messages?.length ?? 0,
    snippet: thread.snippet,
    category: thread.category,
    isStarred: thread.isStarred,
    isRead: thread.isRead,
    labels: thread.labels,
  }
}

function mapPrismaMessage(msg: any): EmailMessage {
  return {
    id: msg.id,
    threadId: msg.threadId,
    from: { name: msg.fromName, email: msg.fromEmail, role: 'from' },
    to: msg.to as ThreadParticipant[],
    cc: (msg.cc ?? []) as ThreadParticipant[],
    bcc: (msg.bcc ?? []) as ThreadParticipant[],
    subject: msg.subject,
    body: msg.body,
    bodyType: msg.bodyType,
    sentAt: msg.sentAt.toISOString(),
    receivedAt: msg.receivedAt.toISOString(),
    attachments: (msg.attachments ?? []).map((a: any) => ({
      id: a.id,
      filename: a.filename,
      mimeType: a.mimeType,
      size: a.size,
      url: a.url,
    })),
  }
}

// ──────────────────────────────────────────────
// GET /threads  —  List threads
// ──────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      sort = 'lastMessageAt',
      order = 'desc',
      q,
      category,
      read,
      starred,
      from,
      label,
      before,
      after,
    } = req.query as Record<string, string | undefined>

    const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20))
    const orderDir = order === 'asc' ? 'asc' : 'desc'
    const userId = currentUserId(req)

    const allowedSorts = ['lastMessageAt', 'createdAt', 'subject'] as const
    const sortField = allowedSorts.includes(sort as any) ? sort : 'lastMessageAt'

    const where: any = { userId }

    if (category) where.category = category
    if (read !== undefined) where.isRead = read === 'true'
    if (starred !== undefined) where.isStarred = starred === 'true'
    if (from) where.participants = { some: { email: from } }
    if (label) where.labels = { has: label }
    if (before) where.lastMessageAt = { ...(where.lastMessageAt ?? {}), lt: new Date(before) }
    if (after) where.lastMessageAt = { ...(where.lastMessageAt ?? {}), gt: new Date(after) }
    if (q) {
      where.OR = [
        { subject: { contains: q, mode: 'insensitive' } },
        { snippet: { contains: q, mode: 'insensitive' } },
        { messages: { some: { body: { contains: q, mode: 'insensitive' } } } },
      ]
    }

    const [threads, totalItems] = await Promise.all([
      prisma.thread.findMany({
        where,
        orderBy: { [sortField]: orderDir },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          participants: true,
          _count: { select: { messages: true } },
        },
      }),
      prisma.thread.count({ where }),
    ])

    const data = threads.map(mapPrismaThread)
    res.json(paginated(data, pageNum, limitNum, totalItems))
  } catch (err) {
    console.error('GET /threads error:', err)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to list threads' })
  }
})

// ──────────────────────────────────────────────
// GET /threads/:id  —  Open a thread
// ──────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = currentUserId(req)

    const thread = await prisma.thread.findFirst({
      where: { id, userId },
      include: {
        participants: true,
        messages: {
          orderBy: { receivedAt: 'asc' },
          include: { attachments: true },
        },
        _count: { select: { messages: true } },
      },
    })

    if (!thread) {
      const { status, body } = apiError(404, 'NOT_FOUND', 'Thread not found')
      return res.status(status).json(body)
    }

    const response: ThreadDetailResponse = {
      data: {
        thread: mapPrismaThread(thread),
        messages: thread.messages.map(mapPrismaMessage),
      },
    }

    res.json(response)
  } catch (err) {
    console.error('GET /threads/:id error:', err)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch thread' })
  }
})

// ──────────────────────────────────────────────
// POST /threads/:id/reply  —  Reply in thread
// ──────────────────────────────────────────────

router.post('/:id/reply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = currentUserId(req)
    const payload = req.body as ReplyRequest

    const thread = await prisma.thread.findFirst({
      where: { id, userId },
    })

    if (!thread) {
      const { status, body } = apiError(404, 'NOT_FOUND', 'Thread not found')
      return res.status(status).json(body)
    }

    if (!payload.body) {
      const { status, body } = apiError(400, 'VALIDATION_ERROR', 'body is required', [
        { field: 'body', code: 'REQUIRED', message: 'body is required' },
      ])
      return res.status(status).json(body)
    }

    const now = new Date()
    const messageId = uuid()

    const savedAttachments = payload.attachments
      ? await Promise.all(
          payload.attachments.map((a) =>
            prisma.attachment.create({
              data: {
                id: uuid(),
                messageId,
                filename: a.filename,
                mimeType: a.mimeType,
                size: a.size,
                url: `https://storage.warpspeed.app/attachments/${uuid()}/${a.filename}`,
              },
            }),
          ),
        )
      : []

    const message = await prisma.message.create({
      data: {
        id: messageId,
        threadId: thread.id,
        fromEmail: req.user!.email,
        fromName: req.user!.name,
        to: payload.to,
        cc: payload.cc ?? [],
        bcc: payload.bcc ?? [],
        subject: thread.subject,
        body: payload.body,
        bodyType: payload.bodyType ?? 'plain',
        sentAt: now,
        receivedAt: now,
        attachments: { connect: savedAttachments.map((a) => ({ id: a.id })) },
      },
      include: { attachments: true },
    })

    const updatedThread = await prisma.thread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: now,
        snippet: payload.body.slice(0, 200),
        isRead: true,
      },
      include: {
        participants: true,
        _count: { select: { messages: true } },
      },
    })

    const response: SentMessageResponse = {
      data: {
        message: mapPrismaMessage(message),
        thread: mapPrismaThread(updatedThread),
      },
    }

    res.status(201).json(response)
  } catch (err) {
    console.error('POST /threads/:id/reply error:', err)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to send reply' })
  }
})

// ──────────────────────────────────────────────
// POST /threads  —  Create a new thread
// ──────────────────────────────────────────────

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = currentUserId(req)
    const payload = req.body as CreateThreadRequest

    if (!payload.subject) {
      const { status, body } = apiError(400, 'VALIDATION_ERROR', 'subject is required', [
        { field: 'subject', code: 'REQUIRED', message: 'subject is required' },
      ])
      return res.status(status).json(body)
    }

    if (!payload.body) {
      const { status, body } = apiError(400, 'VALIDATION_ERROR', 'body is required', [
        { field: 'body', code: 'REQUIRED', message: 'body is required' },
      ])
      return res.status(status).json(body)
    }

    const now = new Date()
    const threadId = uuid()
    const messageId = uuid()

    const allParticipants = [
      { name: req.user!.name, email: req.user!.email, role: 'from' },
      ...(payload.to ?? []).map((p) => ({ ...p, role: 'to' as const })),
      ...(payload.cc ?? []).map((p) => ({ ...p, role: 'cc' as const })),
      ...(payload.bcc ?? []).map((p) => ({ ...p, role: 'bcc' as const })),
    ]

    const savedAttachments = payload.attachments
      ? await Promise.all(
          payload.attachments.map((a) =>
            prisma.attachment.create({
              data: {
                id: uuid(),
                messageId,
                filename: a.filename,
                mimeType: a.mimeType,
                size: a.size,
                url: `https://storage.warpspeed.app/attachments/${uuid()}/${a.filename}`,
              },
            }),
          ),
        )
      : []

    const thread = await prisma.thread.create({
      data: {
        id: threadId,
        userId,
        subject: payload.subject,
        snippet: payload.body.slice(0, 200),
        category: 'sent',
        isRead: true,
        isStarred: false,
        labels: [],
        lastMessageAt: now,
        participants: {
          create: allParticipants.map((p) => ({
            id: uuid(),
            name: p.name,
            email: p.email,
            role: p.role,
          })),
        },
        messages: {
          create: {
            id: messageId,
            fromEmail: req.user!.email,
            fromName: req.user!.name,
            to: payload.to,
            cc: payload.cc ?? [],
            bcc: payload.bcc ?? [],
            subject: payload.subject,
            body: payload.body,
            bodyType: payload.bodyType ?? 'plain',
            sentAt: now,
            receivedAt: now,
            attachments: savedAttachments.length > 0
              ? { connect: savedAttachments.map((a) => ({ id: a.id })) }
              : undefined,
          },
        },
      },
      include: {
        participants: true,
        messages: { include: { attachments: true } },
        _count: { select: { messages: true } },
      },
    })

    const response: SentMessageResponse = {
      data: {
        thread: mapPrismaThread(thread),
        message: mapPrismaMessage(thread.messages[0]),
      },
    }

    res.status(201).json(response)
  } catch (err) {
    console.error('POST /threads error:', err)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create thread' })
  }
})

export default router
