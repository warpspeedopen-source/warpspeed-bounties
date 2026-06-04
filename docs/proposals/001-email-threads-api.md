# ADR: Email Threads API

**Status:** Proposed
**Date:** 2023-10-27
**Context:** Fulfills the bounty for building a thread-first Email API.

## 1. Overview

This document outlines the technical design for a new thread-first Email API. The goal is to allow users to interact with email conversations (threads) rather than individual messages. This aligns with modern email clients and improves user experience by grouping related communications.

This implementation will cover:
- Listing email threads.
- Viewing a single thread with all its messages.
- Ensuring drafts are correctly associated with threads.
- Maintaining consistent filtering, searching, and sorting behavior.
- Updating thread order based on new activity (new messages, draft updates).

## 2. Data Model Changes (Prisma)

To support threading, we will introduce a new `EmailThread` model and update the existing `Email` model.

### New `EmailThread` Model

```prisma
// file: prisma/schema.prisma

model EmailThread {
  id        String   @id @default(cuid())
  userId    String
  subject   String
  updatedAt DateTime @updatedAt // Used for sorting threads

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  emails    Email[]

  @@index([userId, updatedAt])
}
```
- `subject`: The normalized subject line used for grouping.
- `updatedAt`: Timestamp of the last activity in the thread (latest email received, or draft created/updated). This is crucial for sorting threads by recency.

### Modified `Email` Model

We will add a foreign key relationship from `Email` to `EmailThread`.

```prisma
// file: prisma/schema.prisma

model Email {
  id        String   @id @default(cuid())
  // ... existing fields: subject, from, to, body, etc.
  isDraft   Boolean  @default(false)
  isArchived Boolean @default(false)
  isDeleted  Boolean @default(false)

  threadId  String?
  thread    EmailThread? @relation(fields: [threadId], references: [id], onDelete: Cascade)

  // ... other fields and relations
}
```
- `threadId`: A nullable foreign key linking the email to its parent thread.

A background migration or a one-time script will be required to process existing emails and group them into threads based on headers (`In-Reply-To`, `References`) and subjects.

## 3. API Endpoints

We will introduce two new primary endpoints. All endpoints must enforce existing ownership and access control rules.

### `GET /api/v1/threads`

Lists email threads for the authenticated user.

**Query Parameters:**

- `filter` (string): Pre-defined filters like `inbox`, `sent`, `drafts`, `archived`. Defaults to `inbox` (which excludes archived messages).
- `search` (string): A search query to filter threads. The search will be performed on the content of all messages within a thread.
- `limit` (number): Pagination limit. Defaults to `50`.
- `page` (number): Pagination page. Defaults to `1`.

**Logic:**

1.  The service will find all `Email`s matching the filter/search criteria for the user.
2.  It will group these `Email`s by their `threadId`.
3.  For each `threadId`, it will fetch the `EmailThread` metadata.
4.  Threads will be ordered by `updatedAt` descending.
5.  The response will be a paginated list of threads. Each item in the list will include thread metadata and a snippet of the most recent message.

**Example Response:**

```json
{
  "data": [
    {
      "id": "thread_1",
      "subject": "Re: Project Update",
      "updatedAt": "2023-10-27T10:00:00Z",
      "messageCount": 5,
      "hasDrafts": true,
      "participants": [ ... ],
      "latestMessageSnippet": "Sounds good, I'll have the report ready by EOD."
    }
  ],
  "pagination": { ... }
}
```

### `GET /api/v1/threads/:id`

Retrieves a single email thread, including all its messages.

**Response:**

- Returns the `EmailThread` object along with an array of all associated `Email` objects (drafts included), sorted chronologically.
- Archived and deleted messages should be excluded by default.

**Example Response:**

```json
{
  "id": "thread_1",
  "subject": "Re: Project Update",
  "updatedAt": "2023-10-27T10:00:00Z",
  "participants": [ ... ],
  "messages": [
    { "id": "msg_1", "from": "...", "body": "...", "sentAt": "..." },
    { "id": "msg_2", "from": "...", "body": "...", "sentAt": "..." },
    { "id": "msg_draft_3", "isDraft": true, "body": "...", "updatedAt": "..." }
  ]
}
```

## 4. Core Logic & Services

### Thread Grouping Service

- A new service will be responsible for identifying which thread an email belongs to upon sync/receipt.
- For new incoming emails, it will use `In-Reply-To` and `References` headers first.
- As a fallback, it will use a normalized subject line match (e.g., ignoring "Re:", "Fwd:").
- If no matching thread is found, a new `EmailThread` will be created.

### Draft Management

- **Creating a draft (reply/forward):** When a user replies to a message, the new draft is immediately associated with the parent message's thread. The `EmailThread.updatedAt` timestamp must be updated to the draft's creation/update time. This pushes the thread to the top of the list.
- **Creating a new draft (new conversation):** A new `EmailThread` is created immediately.
- **Sending a draft:** The `Email`'s `isDraft` flag is set to `false`, but it remains in the same thread. The thread's `updatedAt` is updated to the send time.

### Search and Filtering

- When a search is performed via `GET /api/v1/threads?search=...`, the query should execute against the `Email` model.
- The query will find all `Email`s matching the search term.
- The distinct `threadId`s from those emails are then used to fetch the full threads.
- This ensures that if any message in a thread matches, the entire thread is returned in the search results.

## 5. Testing Strategy

A comprehensive test suite using Jest is required.

- **Unit Tests:**
  - Test the thread grouping logic with various email headers and subjects.
  - Test the draft handling logic in the service layer.
- **Integration Tests:**
  - Test `GET /api/v1/threads` for correct authentication, filtering (`inbox`, `archived`), searching, and pagination.
  - Test that creating/updating a draft correctly updates the parent `EmailThread.updatedAt` and brings the thread to the top of the list.
  - Test `GET /api/v1/threads/:id` to ensure it returns all relevant messages (including drafts) and excludes archived/deleted ones.
  - Test the end-to-end flow: a new email comes in, is assigned to a new/existing thread, a reply is drafted, and the thread's recency is updated correctly.

## 6. API Documentation

- The new endpoints (`/threads` and `/threads/:id`) must be fully documented in the project's Swagger/OpenAPI specification.
- Documentation should include all query parameters, request bodies, and example responses.
