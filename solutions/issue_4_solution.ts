# Email Threads API — Implementation

Implements a backend Email Threads API per issue #4 (Node.js + Prisma + TypeScript).

## Design
- `GET /api/threads` — list threads with pagination, sorted by most recent activity.
- `GET /api/threads/:id` — fetch a single thread with all its messages ordered chronologically.
- `POST /api/threads/:id/messages` — append a message to a thread (updates `lastActivityAt`).
- `DELETE /api/threads/:id` — soft-delete a thread.
- Thread grouping: messages sharing a normalized `subject` (strip `Re:`/`Fwd:` prefixes) OR an explicit `threadId` are grouped into one thread.

## Prisma schema
```prisma
model Thread {
  id             String    @id @default(cuid())
  subject        String
  normalizedKey  String    @unique
  lastActivityAt DateTime  @default(now())
  deletedAt      DateTime?
  messages       Message[]
  createdAt      DateTime  @default(now())
  @@index([lastActivityAt])
}

model Message {
  id        String   @id @default(cuid())
  threadId  String
  thread    Thread   @relation(fields: [threadId], references: [id], onDelete: Cascade)
  from      String
  to        String[]
  body      String
  sentAt    DateTime @default(now())
  @@index([threadId, sentAt])
}
```

## Route handlers (src/routes/threads.ts)
```ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
export const threads = Router();

const normalizeSubject = (s: string) =>
  s.replace(/^((re|fwd|fw):\s*)+/i, "").trim().toLowerCase();

const ListQuery = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

threads.get("/", async (req, res) => {
  const { limit, cursor } = ListQuery.parse(req.query);
  const rows = await prisma.thread.findMany({
    where: { deletedAt: null },
    orderBy: { lastActivityAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { _count: { select: { messages: true } } },
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  res.json({
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
});

threads.get("/:id", async (req, res) => {
  const thread = await prisma.thread.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: { messages: { orderBy: { sentAt: "asc" } } },
  });
  if (!thread) return res.status(404).json({ error: "thread_not_found" });
  res.json(thread);
});

const NewMessage = z.object({
  from: z.string().email(),
  to: z.array(z.string().email()).min(1),
  body: z.string().min(1),
  subject: z.string().optional(),
  sentAt: z.coerce.date().optional(),
});

threads.post("/:id/messages", async (req, res) => {
  const data = NewMessage.parse(req.body);
  const thread = await prisma.thread.findFirst({
    where: { id: req.params.id, deletedAt: null },
  });
  if (!thread) return res.status(404).json({ error: "thread_not_found" });

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { threadId: thread.id, from: data.from, to: data.to, body: data.body, sentAt: data.sentAt },
    }),
    prisma.thread.update({
      where: { id: thread.id },
      data: { lastActivityAt: data.sentAt ?? new Date() },
    }),
  ]);
  res.status(201).json(message);
});

threads.delete("/:id", async (req, res) => {
  const { count } = await prisma.thread.updateMany({
    where: { id: req.params.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (!count) return res.status(404).json({ error: "thread_not_found" });
  res.status(204).end();
});

// Ingest: create-or-append by normalized subject (thread grouping)
const Ingest = NewMessage.extend({ subject: z.string().min(1) });
export async function ingestEmail(input: z.infer<typeof Ingest>) {
  const normalizedKey = normalizeSubject(input.subject);
  const thread = await prisma.thread.upsert({
    where: { normalizedKey },
    create: { subject: input.subject, normalizedKey, lastActivityAt: input.sentAt ?? new Date() },
    update: { lastActivityAt: input.sentAt ?? new Date() },
  });
  return prisma.message.create({
    data: { threadId: thread.id, from: input.from, to: input.to, body: input.body, sentAt: input.sentAt },
  });
}
```

## Tests (src/routes/threads.test.ts)
```ts
import request from "supertest";
import { app } from "../app";

describe("Email Threads API", () => {
  it("lists threads newest-first with pagination", async () => {
    const res = await request(app).get("/api/threads?limit=1");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeLessThanOrEqual(1);
    expect(res.body).toHaveProperty("nextCursor");
  });

  it("groups Re:/Fwd: replies into one thread", async () => {
    await request(app).post("/api/threads/ingest").send({
      from: "a@x.com", to: ["b@x.com"], subject: "Hello", body: "hi",
    });
    await request(app).post("/api/threads/ingest").send({
      from: "b@x.com", to: ["a@x.com"], subject: "Re: Hello", body: "hey",
    });
    const list = await request(app).get("/api/threads");
    const hello = list.body.items.find((t: any) => t.normalizedKey === "hello");
    expect(hello._count.messages).toBe(2);
  });

  it("404s unknown thread", async () => {
    const res = await request(app).get("/api/threads/nope");
    expect(res.status).toBe(404);
  });
});
```

## Notes
- Pagination is cursor-based (stable under concurrent inserts).
- Soft-delete preserves audit history; list/get filter `deletedAt: null`.
- Thread grouping via `normalizedKey` is idempotent and handles `Re:`/`Fwd:`/`Fw:` chains.
- All input validated with Zod; errors return structured JSON.
- `$transaction` ensures message insert + thread activity bump are atomic.
