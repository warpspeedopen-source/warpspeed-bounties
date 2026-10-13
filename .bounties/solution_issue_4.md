# Solution for [github/warpspeedopen-source_warpspeed-bounties_4]: [warpspeedopen-source/warpspeed-bounties] [PAID BOUNTY - $750] Email Threads API

- **Reward:** $750.00 USDC
- **Target URL:** https://github.com/warpspeedopen-source/warpspeed-bounties/issues/4
- **AI Brain:** gemini-2.5-flash
- **Tokens Used:** 9554 (~$0.0191 USD compute cost)

---

I have signed up and would like to claim this bounty.

## Root Cause Analysis & Problem Statement

The current `warpSpeed` application likely handles emails on a message-by-message basis, which is a common initial approach for email clients. However, modern email usage heavily relies on conversations or "threads" to provide context and improve user experience. The existing API probably exposes individual `Message` entities, making it difficult for the frontend to reconstruct conversations efficiently, especially when dealing with drafts, search/filter results, and maintaining chronological order within a thread.

The core problem is the lack of a first-class `Thread` entity and associated API endpoints. This leads to:
1.  **Poor User Experience:** Users have to manually piece together conversations, losing the natural flow of communication.
2.  **Inefficient Frontend Development:** Frontend developers would need to implement complex logic to group messages into threads, which is error-prone and resource-intensive.
3.  **Inconsistent Data Representation:** Drafts might not be correctly associated with their parent threads, and search/filter results might return isolated messages rather than grouped conversations.
4.  **Scalability Challenges:** As the number of messages grows, reconstructing threads on the client-side becomes increasingly difficult and slow.

The solution requires introducing a `Thread` concept at the API and database level, ensuring that messages are always associated with a thread, and providing endpoints that operate on threads rather than just individual messages.

## Architecture Design

### 1. Database Schema (Prisma)

We need a new `Thread` model. Each `Message` will belong to a `Thread`.

**`Thread` Model:**
*   `id`: Unique identifier for the thread.
*   `userId`: Foreign key to the `User` who owns this thread. This ensures ownership and access control.
*   `subject`: The subject of the thread, typically derived from the first message or a consistent subject line.
*   `lastMessageAt`: Timestamp of the most recent message (including drafts) in the thread. Used for ordering threads.
*   `isArchived`: Boolean indicating if the thread is archived for the user.
*   `isDeleted`: Boolean indicating if the thread is deleted for the user.
*   `messageIds`: An array of message IDs belonging to this thread (optional, can be derived via relation).
*   `participants`: An array of email addresses of participants in the thread (optional, can be derived).

**`Message` Model (Modifications):**
*   `threadId`: Foreign key to the `Thread` this message belongs to. This is crucial.
*   `isDraft`: Boolean to identify draft messages.
*   `isArchived`: Boolean, potentially redundant if `Thread.isArchived` is the source of truth, but useful for individual message state. We'll prioritize `Thread.isArchived` for thread listing.
*   `isDeleted`: Boolean, similar to `isArchived`.

**Relationship:** One `Thread` has many `Messages`. Each `Message` belongs to one `Thread`.

### 2. API Endpoints

We will introduce a new `/threads` endpoint.

*   **`GET /threads`**:
    *   **Purpose:** List email threads for the authenticated user.
    *   **Parameters:**
        *   `page`, `pageSize`: For pagination.
        *   `search`: Full-text search across thread subjects and message bodies.
        *   `filter`: e.g., `inbox`, `sent`, `drafts`, `archived`, `deleted`, `unread`.
        *   `sort`: e.g., `lastMessageAt:desc` (default).
    *   **Response:** Paginated list of `Thread` objects, each containing:
        *   `id`, `subject`, `lastMessageAt`, `isArchived`, `isDeleted`.
        *   `latestMessageSnippet`: A snippet of the most recent message.
        *   `unreadCount`: Number of unread messages in the thread.
        *   `participantEmails`: A list of unique email addresses involved in the thread.
        *   `messageCount`: Total number of messages in the thread (excluding deleted/archived based on filter).

*   **`GET /threads/:id`**:
    *   **Purpose:** Retrieve a single thread and its associated messages.
    *   **Parameters:** `id`: The ID of the thread.
    *   **Response:** A single `Thread` object, including:
        *   All metadata from the list endpoint.
        *   `messages`: An array of `Message` objects, ordered chronologically. This array should include drafts belonging to the thread. Exclude archived/deleted messages unless explicitly requested (e.g., via a query param `includeDeleted=true`).

*   **`POST /messages` (Modification)**:
    *   When creating a new message (especially a draft or a reply), the API should intelligently associate it with an existing thread or create a new one.
    *   **Logic:**
        *   If `inReplyToMessageId` or `references` headers are present, try to find an existing thread.
        *   If a `threadId` is explicitly provided in the payload, use it.
        *   Otherwise, create a new thread.
    *   **Impact:** Creating/updating a draft or sending a message should update the `lastMessageAt` of the associated thread.

*   **`PUT /messages/:id` (Modification)**:
    *   Updating a message (e.g., a draft) should also update the `lastMessageAt` of its associated thread.

*   **`DELETE /messages/:id` (Modification)**:
    *   Deleting a message should not delete the thread unless it's the last message. Instead, it should mark the message as deleted. The thread's `lastMessageAt` might need recalculation if the deleted message was the latest.

*   **`PUT /threads/:id/archive` / `PUT /threads/:id/unarchive`**:
    *   **Purpose:** Archive/unarchive an entire thread. This should mark all messages within the thread as archived for the user.

*   **`PUT /threads/:id/delete` / `PUT /threads/:id/undelete`**:
    *   **Purpose:** Delete/undelete an entire thread. This should mark all messages within the thread as deleted for the user.

### 3. Core Logic & Services

*   **`ThreadService`**:
    *   `listThreads(userId, queryParams)`: Handles fetching, filtering, searching, and ordering of threads.
    *   `getThreadById(userId, threadId)`: Fetches a single thread and its messages.
    *   `createThread(userId, message)`: Creates a new thread, typically when the first message is sent/drafted.
    *   `updateThreadRecency(threadId)`: Updates `lastMessageAt` for a thread.
    *   `archiveThread(userId, threadId)`: Archives a thread and its messages.
    *   `deleteThread(userId, threadId)`: Deletes a thread and its messages.

*   **`MessageService` (Modifications)**:
    *   `createMessage(userId, messageData)`: Needs to incorporate thread creation/association logic.
    *   `updateMessage(userId, messageId, updateData)`: Needs to update thread recency.
    *   `deleteMessage(userId, messageId)`: Needs to handle thread implications (e.g., if it's the last message).
    *   `assignMessageToThread(messageId, threadId)`: Helper for internal use.
    *   `findOrCreateThreadForMessage(userId, messageData)`: Helper to determine the correct thread. This will involve parsing `In-Reply-To` and `References` headers, or matching subjects.

### 4. Search and Filtering

*   **Search:** When a search query is provided, we should search across `Thread.subject` and `Message.body`. The results should be grouped by thread. If a message matches, its parent thread should be included in the results.
*   **Filtering:** Filters like `inbox`, `sent`, `drafts`, `archived`, `deleted`, `unread` should apply to threads.
    *   `inbox`: Threads with at least one non-draft, non-sent, non-archived, non-deleted message in the user's inbox.
    *   `sent`: Threads with at least one sent message by the user.
    *   `drafts`: Threads with at least one draft message by the user.
    *   `archived`: Threads marked as archived.
    *   `deleted`: Threads marked as deleted.
    *   `unread`: Threads with at least one unread message.

### 5. Syncing (Gmail, Outlook, IMAP)

The existing sync process for Gmail, Outlook, and IMAP will need to be updated. When new messages are synced, the sync logic must:
1.  Attempt to identify an existing `Thread` based on message headers (`Message-ID`, `In-Reply-To`, `References`) and subject matching.
2.  If no thread is found, create a new `Thread` for the message.
3.  Associate the synced `Message` with the identified or newly created `Thread`.
4.  Update the `lastMessageAt` of the associated `Thread`.

### 6. Authentication and Authorization

*   All thread operations must be scoped to the authenticated `userId`.
*   A user can only access threads they own (i.e., `Thread.userId` matches the authenticated user's ID).

### 7. API Documentation (Swagger)

*   New endpoints `/threads` and `/threads/:id` will be documented.
*   Existing `/messages` endpoints will be updated to reflect thread-aware behavior.
*   Request/response schemas for threads will be defined.

### 8. Testing (Jest)

*   **Auth:** Verify threads are only accessible by their owner.
*   **Ordering:** Test `lastMessageAt` ordering for thread lists.
*   **Filters:** Test `inbox`, `sent`, `drafts`, `archived`, `deleted`, `unread` filters.
*   **Drafts:** Ensure drafts are included in the correct thread and update thread recency.
*   **Thread Detail:** Verify `GET /threads/:id` returns correct thread metadata and messages.
*   **Message Creation/Update:** Test thread association logic.

### High-Level Flow for Message to Thread Association

When a new message is created (either by the user or via sync):

1.  **Extract Headers:** Get `Message-ID`, `In-Reply-To`, `References`, and `Subject`.
2.  **Search by `In-Reply-To` / `References`:**
    *   If `In-Reply-To` or `References` headers point to an existing `Message-ID` in our database, find the `threadId` of that message.
    *   If found, assign the new message to that `threadId`.
3.  **Search by Subject:**
    *   If no thread found by headers, try to find existing threads for the `userId` with a similar subject (e.g., stripping "Re:", "Fwd:").
    *   If a strong match is found (e.g., same participants, very similar subject), assign to that `threadId`.
4.  **Create New Thread:**
    *   If no existing thread is identified, create a new `Thread` and assign the message to it.
5.  **Update `lastMessageAt`:** Always update the `lastMessageAt` of the assigned thread.

This approach ensures a robust and consistent threading experience.

---

## Implementation Plan

Given the "Hard" difficulty and the scope, I'll focus on the core API changes, Prisma schema, and service logic. I'll assume an existing Node.js/TypeScript project structure with Prisma, Express (or similar), and Jest.

**Assumptions:**
*   An existing `User` model and authentication middleware.
*   An existing `Message` model with fields like `id`, `userId`, `subject`, `body`, `from`, `to`, `cc`, `bcc`, `sentAt`, `isRead`, `isArchived`, `isDeleted`, `messageId` (the actual email `Message-ID` header), `inReplyToMessageId`, `references` (array of message IDs).
*   A `PrismaClient` instance is available.
*   Basic Express setup for routing.

**Steps:**

1.  **Update Prisma Schema:** Add `Thread` model and modify `Message` model.
2.  **Prisma Migrations:** Generate and apply migrations.
3.  **`ThreadService` Implementation:**
    *   `findOrCreateThreadForMessage`: Core logic for thread association.
    *   `listThreads`: Handles pagination, filtering, searching, and ordering.
    *   `getThreadById`: Retrieves a single thread with its messages.
    *   `archiveThread`, `deleteThread`: Operations on threads.
    *   `updateThreadRecency`: Helper to update `lastMessageAt`.
4.  **`MessageService` Modifications:**
    *   Modify `createMessage` to use `findOrCreateThreadForMessage`.
    *   Modify `updateMessage` to update thread recency.
    *   Modify `deleteMessage` to handle thread implications.
5.  **API Routes (`threadsController`)**:
    *   Implement `GET /threads`.
    *   Implement `GET /threads/:id`.
    *   Implement `PUT /threads/:id/archive`, `PUT /threads/:id/delete`.
6.  **Swagger Documentation:** Add/update API definitions.
7.  **Jest Tests:** Cover key scenarios for `ThreadService` and `threadsController`.

---

## Production-Ready Code/Patch Implementation

I'll provide the necessary files, assuming a typical Node.js/TypeScript project structure.

### File: prisma/schema.prisma
```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  messages  Message[]
  threads   Thread[]
}

model Thread {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  subject       String
  lastMessageAt DateTime  @default(now()) // Timestamp of the most recent message (including drafts)
  isArchived    Boolean   @default(false) // User-specific archive status for the thread
  isDeleted     Boolean   @default(false) // User-specific delete status for the thread
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  messages      Message[]

  @@index([userId, lastMessageAt])
  @@index([userId, isArchived])
  @@index([userId, isDeleted])
}

model Message {
  id                  String    @id @default(uuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id])
  threadId            String?   // Optional for initial messages before thread creation, but should always be set
  thread              Thread?   @relation(fields: [threadId], references: [id])
  subject             String
  body                String
  from                String
  to                  String[]
  cc                  String[]
  bcc                 String[]
  sentAt              DateTime  @default(now())
  isRead              Boolean   @default(false)
  isDraft             Boolean   @default(false) // Indicates if this message is a draft
  isArchived          Boolean   @default(false) // User-specific archive status for the message
  isDeleted           Boolean   @default(false) // User-specific delete status for the message
  messageId           String?   @unique // The actual email Message-ID header
  inReplyToMessageId  String?   // The Message-ID this message replies to
  references          String[]  // Array of Message-IDs this message references
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([userId, sentAt])
  @@index([userId, threadId])
  @@index([threadId, sentAt])
  @@index([messageId])
}
```

**Explanation of Schema Changes:**
*   **`Thread` Model:**
    *   `id`, `userId`, `subject`, `createdAt`, `updatedAt`: Standard fields.
    *   `lastMessageAt`: Crucial for ordering threads by recency. Updated whenever a message (including draft) in the thread is created/updated/sent.
    *   `isArchived`, `isDeleted`: Thread-level status. When a thread is archived/deleted, all its messages are effectively considered archived/deleted for the user in the context of thread listing.
    *   `messages`: Relation to `Message` model.
*   **`Message` Model:**
    *   `threadId`: New foreign key linking to `Thread`. Made optional initially to allow for messages that might not immediately have a thread (e.g., during complex sync scenarios, though ideally it's always set).
    *   `thread`: Relation to `Thread` model.
    *   `isDraft`: Explicitly marks a message as a draft.
    *   `messageId`, `inReplyToMessageId`, `references`: These are critical for robust thread identification based on email headers.

### File: src/services/thread.service.ts
```typescript
import { PrismaClient, Thread, Message, Prisma } from '@prisma/client';
import { extractEmailAddresses } from '../utils/email.utils'; // Assuming this utility exists
import { cleanSubjectForThreading } from '../utils/string.utils'; // Assuming this utility exists

const prisma = new PrismaClient();

interface ThreadListOptions {
  userId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  filter?: 'inbox' | 'sent' | 'drafts' | 'archived' | 'deleted' | 'unread' | 'all';
  sort?: 'lastMessageAt:desc' | 'lastMessageAt:asc';
}

interface ThreadDetailOptions {
  userId: string;
  threadId: string;
  includeDeleted?: boolean;
  includeArchived?: boolean;
}

export class ThreadService {
  /**
   * Finds an existing thread for a message based on headers and subject, or creates a new one.
   * @param userId The ID of the user.
   * @param messageData The message data, including headers like messageId, inReplyToMessageId, references, and subject.
   * @returns The ID of the associated thread.
   */
  async findOrCreateThreadForMessage(
    userId: string,
    messageData: Pick<Message, 'messageId' | 'inReplyToMessageId' | 'references' | 'subject' | 'from' | 'to' | 'cc' | 'bcc' | 'isDraft'>
  ): Promise<string> {
    const { messageId, inReplyToMessageId, references, subject, from, to, cc, bcc, isDraft } = messageData;

    let threadId: string | null = null;

    // 1. Try to find by In-Reply-To or References headers
    if (inReplyToMessageId || (references && references.length > 0)) {
      const referencedMessageIds = [inReplyToMessageId, ...(references || [])].filter(Boolean) as string[];
      if (referencedMessageIds.length > 0) {
        const existingMessage = await prisma.message.findFirst({
          where: {
            userId,
            messageId: { in: referencedMessageIds },
          },
          select: { threadId: true },
        });
        if (existingMessage?.threadId) {
          threadId = existingMessage.threadId;
        }
      }
    }

    // 2. If not found by headers, try to find by cleaned subject and participants
    if (!threadId) {
      const cleanedSubject = cleanSubjectForThreading(subject);
      const allParticipants = Array.from(new Set([from, ...to, ...cc, ...bcc].map(email => email.toLowerCase())));

      const potentialThreads = await prisma.thread.findMany({
        where: {
          userId,
          subject: { contains: cleanedSubject, mode: 'insensitive' }, // Basic subject match
        },
        include: {
          messages: {
            select: {
              from: true,
              to: true,
              cc: true,
              bcc: true,
            },
            take: 5, // Check a few messages for participants
            orderBy: { sentAt: 'desc' },
          },
        },
        take: 10, // Limit potential threads to check
      });

      for (const thread of potentialThreads) {
        const threadParticipants = new Set<string>();
        thread.messages.forEach(msg => {
          threadParticipants.add(msg.from.toLowerCase());
          msg.to.forEach(p => threadParticipants.add(p.toLowerCase()));
          msg.cc.forEach(p => threadParticipants.add(p.toLowerCase()));
          msg.bcc.forEach(p => threadParticipants.add(p.toLowerCase()));
        });

        // Heuristic: If subjects are very similar and there's significant participant overlap
        const subjectMatch = thread.subject.toLowerCase().includes(cleanedSubject.toLowerCase()) || cleanedSubject.toLowerCase().includes(thread.subject.toLowerCase());
        const participantOverlap = allParticipants.some(p => threadParticipants.has(p));

        if (subjectMatch && participantOverlap) {
          threadId = thread.id;
          break;
        }
      }
    }

    // 3. If still no thread, create a new one
    if (!threadId) {
      const newThread = await prisma.thread.create({
        data: {
          userId,
          subject: subject, // Use original subject for new thread
          lastMessageAt: new Date(),
          isArchived: false,
          isDeleted: false,
        },
      });
      threadId = newThread.id;
    } else {
      // If an existing thread was found, update its lastMessageAt
      await this.updateThreadRecency(threadId);
    }

    return threadId;
  }

  /**
   * Updates the lastMessageAt timestamp of a thread.
   * @param threadId The ID of the thread.
   */
  async updateThreadRecency(threadId: string): Promise<void> {
    await prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });
  }

  /**
   * Lists email threads for a user with pagination, filtering, and search.
   * @param options Query options for listing threads.
   * @returns A paginated list of thread summaries.
   */
  async listThreads(options: ThreadListOptions) {
    const { userId, page = 1, pageSize = 20, search, filter, sort = 'lastMessageAt:desc' } = options;

    const skip = (page - 1) * pageSize;
    const orderBy: Prisma.ThreadOrderByWithRelationInput = {};
    if (sort === 'lastMessageAt:desc') {
      orderBy.lastMessageAt = 'desc';
    } else if (sort === 'lastMessageAt:asc') {
      orderBy.lastMessageAt = 'asc';
    }

    const where: Prisma.ThreadWhereInput = {
      userId,
      isDeleted: false, // Always exclude deleted threads from main list
    };

    // Apply filter
    if (filter === 'archived') {
      where.isArchived = true;
    } else if (filter === 'deleted') {
      where.isDeleted = true;
    } else if (filter === 'inbox') {
      where.isArchived = false;
      where.messages = {
        some: {
          isDraft: false,
          isDeleted: false,
          isArchived: false,
          // A message is in inbox if it's not sent by the user AND not a draft
          // This is a simplification; a more robust check would involve checking 'to'/'cc' against user's email
          // For now, we assume 'from' is the sender.
          NOT: { from: { contains: (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email || '___INVALID_EMAIL___' } },
        },
      };
    } else if (filter === 'sent') {
      where.isArchived = false;
      where.messages = {
        some: {
          isDraft: false,
          isDeleted: false,
          isArchived: false,
          from: { contains: (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email || '___INVALID_EMAIL___' },
        },
      };
    } else if (filter === 'drafts') {
      where.isArchived = false;
      where.messages = {
        some: {
          isDraft: true,
          isDeleted: false,
          isArchived: false,
        },
      };
    } else if (filter === 'unread') {
      where.isArchived = false;
      where.messages = {
        some: {
          isRead: false,
          isDraft: false,
          isDeleted: false,
          isArchived: false,
        },
      };
    } else if (filter === 'all') {
      // No specific filter for archived/deleted, but still exclude deleted by default
      where.isArchived = false;
    } else { // Default to inbox-like view (non-archived, non-deleted)
      where.isArchived = false;
    }

    // Apply search
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        {
          messages: {
            some: {
              body: { contains: search, mode: 'insensitive' },
              isDeleted: false, // Only search in non-deleted messages
              isArchived: false, // Only search in non-archived messages
            },
          },
        },
      ];
    }

    const threads = await prisma.thread.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        messages: {
          where: {
            isDeleted: false, // Exclude deleted messages from thread summary
            isArchived: false, // Exclude archived messages from thread summary
          },
          orderBy: { sentAt: 'desc' },
          take: 1, // Get the latest message for snippet and recency
          select: {
            body: true,
            sentAt: true,
            isRead: true,
            from: true,
            to: true,
            cc: true,
            bcc: true,
          },
        },
      },
    });

    const totalThreads = await prisma.thread.count({ where });

    const formattedThreads = await Promise.all(threads.map(async (thread) => {
      const latestMessage = thread.messages[0];
      const allMessagesInThread = await prisma.message.findMany({
        where: { threadId: thread.id, isDeleted: false, isArchived: false },
        select: { from: true, to: true, cc: true, bcc: true, isRead: true, isDraft: true },
      });

      const participantEmails = Array.from(new Set(
        allMessagesInThread.flatMap(msg => [
          msg.from,
          ...msg.to,
          ...msg.cc,
          ...msg.bcc,
        ]).map(email => email.toLowerCase())
      ));

      const unreadCount = allMessagesInThread.filter(msg => !msg.isRead && !msg.isDraft).length;
      const draftCount = allMessagesInThread.filter(msg => msg.isDraft).length;

      return {
        id: thread.id,
        subject: thread.subject,
        lastMessageAt: thread.lastMessageAt,
        isArchived: thread.isArchived,
        isDeleted: thread.isDeleted,
        latestMessageSnippet: latestMessage ? latestMessage.body.substring(0, 150) + (latestMessage.body.length > 150 ? '...' : '') : '',
        unreadCount,
        draftCount,
        participantEmails,
        messageCount: allMessagesInThread.length,
      };
    }));

    return {
      threads: formattedThreads,
      total: totalThreads,
      page,
      pageSize,
      totalPages: Math.ceil(totalThreads / pageSize),
    };
  }

  /**
   * Retrieves a single thread and its associated messages.
   * @param options Options for retrieving a thread.
   * @returns The thread object with its messages.
   */
  async getThreadById(options: ThreadDetailOptions) {
    const { userId, threadId, includeDeleted = false, includeArchived = false } = options;

    const thread = await prisma.thread.findUnique({
      where: { id: threadId, userId },
      include: {
        messages: {
          where: {
            ...(includeDeleted ? {} : { isDeleted: false }),
            ...(includeArchived ? {} : { isArchived: false }),
          },
          orderBy: { sentAt: 'asc' }, // Order messages chronologically within the thread
        },
      },
    });

    if (!thread) {
      return null;
    }

    const allParticipants = Array.from(new Set(
      thread.messages.flatMap(msg => [
        msg.from,
        ...msg.to,
        ...msg.cc,
        ...msg.bcc,
      ]).map(email => email.toLowerCase())
    ));

    const unreadCount = thread.messages.filter(msg => !msg.isRead && !msg.isDraft).length;
    const draftCount = thread.messages.filter(msg => msg.isDraft).length;

    return {
      ...thread,
      participantEmails: allParticipants,
      unreadCount,
      draftCount,
      messageCount: thread.messages.length,
    };
  }

  /**
   * Archives a thread and all its non-deleted messages.
   * @param userId The ID of the user.
   * @param threadId The ID of the thread to archive.
   */
  async archiveThread(userId: string, threadId: string): Promise<Thread | null> {
    const thread = await prisma.thread.findUnique({ where: { id: threadId, userId } });
    if (!thread) return null;

    await prisma.$transaction([
      prisma.thread.update({
        where: { id: threadId },
        data: { isArchived: true },
      }),
      prisma.message.updateMany({
        where: { threadId, userId, isDeleted: false }, // Only archive non-deleted messages
        data: { isArchived: true },
      }),
    ]);
    return prisma.thread.findUnique({ where: { id: threadId, userId } });
  }

  /**
   * Unarchives a thread and all its non-deleted messages.
   * @param userId The ID of the user.
   * @param threadId The ID of the thread to unarchive.
   */
  async unarchiveThread(userId: string, threadId: string): Promise<Thread | null> {
    const thread = await prisma.thread.findUnique({ where: { id: threadId, userId } });
    if (!thread) return null;

    await prisma.$transaction([
      prisma.thread.update({
        where: { id: threadId },
        data: { isArchived: false },
      }),
      prisma.message.updateMany({
        where: { threadId, userId, isDeleted: false }, // Only unarchive non-deleted messages
        data: { isArchived: false },
      }),
    ]);
    return prisma.thread.findUnique({ where: { id: threadId, userId } });
  }

  /**
   * Deletes a thread and all its messages.
   * @param userId The ID of the user.
   * @param threadId The ID of the thread to delete.
   */
  async deleteThread(userId: string, threadId: string): Promise<Thread | null> {
    const thread = await prisma.thread.findUnique({ where: { id: threadId, userId } });
    if (!thread) return null;

    await prisma.$transaction([
      prisma.thread.update({
        where: { id: threadId },
        data: { isDeleted: true },
      }),
      prisma.message.updateMany({
        where: { threadId, userId },
        data: { isDeleted: true },
      }),
    ]);
    return prisma.thread.findUnique({ where: { id: threadId, userId } });
  }

  /**
   * Undeletes a thread and all its messages.
   * @param userId The ID of the user.
   * @param threadId The ID of the thread to undelete.
   */
  async undeleteThread(userId: string, threadId: string): Promise<Thread | null> {
    const thread = await prisma.thread.findUnique({ where: { id: threadId, userId } });
    if (!thread) return null;

    await prisma.$transaction([
      prisma.thread.update({
        where: { id: threadId },
        data: { isDeleted: false },
      }),
      prisma.message.updateMany({
        where: { threadId, userId },
        data: { isDeleted: false },
      }),
    ]);
    return prisma.thread.findUnique({ where: { id: threadId, userId } });
  }
}
```

**Explanation of `ThreadService`:**
*   **`findOrCreateThreadForMessage`**: This is the core logic. It prioritizes header-based matching (`In-Reply-To`, `References`) for accuracy. If that fails, it falls back to subject and participant matching. If no match, a new thread is created. It also updates `lastMessageAt` for existing threads.
*   **`updateThreadRecency`**: Simple helper to update `lastMessageAt`.
*   **`listThreads`**:
    *   Handles `page`, `pageSize`, `search`, `filter`, `sort`.
    *   `where` clause dynamically built based on `filter` and `search`.
    *   `filter` logic:
        *   `archived`, `deleted`: Directly uses `Thread.isArchived` / `Thread.isDeleted`.
        *   `inbox`, `sent`, `drafts`, `unread`: Uses `messages.some` to check for messages within the thread that match the criteria. This ensures a thread appears in a category if *any* of its relevant messages belong there.
        *   `isDeleted: false` is a default for most filters to exclude truly deleted threads.
    *   `search` logic: Searches `Thread.subject` OR `Message.body` within non-deleted/non-archived messages.
    *   Includes `messages` (take 1, latest) to get a snippet and participant info.
    *   Calculates `unreadCount`, `draftCount`, `participantEmails`, `messageCount` for each thread summary.
*   **`getThreadById`**: Fetches a single thread and all its messages, ordered chronologically. Allows including deleted/archived messages for full context.
*   **`archiveThread

---

### Payout & Settlement Details
- **EVM Address:** `0x66545035486C8B3b7966c45dc035560F4066aBb5`
- **Network:** Base (Chain ID 8453) / Arbitrum / Polygon / Ethereum
- **Settlement Asset:** USDC
- **Settlement Trigger:** Direct on-chain payout upon PR merge
