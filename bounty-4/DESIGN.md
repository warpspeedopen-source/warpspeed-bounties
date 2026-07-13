# Email Threads API — Design Document

## Overview

A thread-first REST API for warpSpeed's email system. Threads group related messages (original + replies) into a single conversation view. The API supports listing, opening, replying, and creating threads.

## Base URL

```
/api/v1/threads
```

## Data Model

```
Thread (1) ──── (N) Message
  │                    │
  │                    └── (N) Attachment
  │
  └── (N) Participant
```

- **Thread**: A conversation identified by an initial subject line. Collapses all messages sharing the same Message-ID / References header chain.
- **Message**: An individual email within a thread. Ordered by `receivedAt`.
- **Participant**: A person who sent or received messages in the thread. Deduplicated across messages.
- **Attachment**: A file attached to a specific message.

## Endpoints

### `GET /threads` — List threads

Returns a paginated, sorted list of threads for the authenticated user.

**Query Parameters**

| Param       | Type    | Default    | Description                                      |
|-------------|---------|------------|--------------------------------------------------|
| `page`      | number  | `1`        | Page number (1-indexed)                          |
| `limit`     | number  | `20`       | Items per page (max 100)                         |
| `sort`      | string  | `lastMessageAt` | Sort field: `lastMessageAt`, `createdAt`, `subject` |
| `order`     | `asc` / `desc` | `desc` | Sort direction                                   |
| `q`         | string  | —          | Full-text search across subject & body           |
| `category`  | string  | —          | Filter: `inbox`, `sent`, `drafts`, `archived`, `spam`, `trash` |
| `read`      | boolean | —          | Filter by read/unread status                     |
| `starred`   | boolean | —          | Filter by starred status                         |
| `from`      | string  | —          | Filter by sender email                           |
| `label`     | string  | —          | Filter by label                                  |
| `before`    | ISO8601 | —          | Threads with `lastMessageAt` before this time    |
| `after`     | ISO8601 | —          | Threads with `lastMessageAt` after this time     |

**Response `200 OK`**

```json
{
  "data": [ /* EmailThread[] */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 142,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Response `200 OK` (empty)**

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 0,
    "totalPages": 0,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### `GET /threads/:id` — Open a thread

Returns the thread metadata plus all messages ordered chronologically.

**Path Parameters**

| Param | Type   | Description         |
|-------|--------|---------------------|
| `id`  | string | Thread UUID         |

**Response `200 OK`**

```json
{
  "data": {
    "thread": { /* EmailThread */ },
    "messages": [ /* EmailMessage[] */ ]
  }
}
```

**Error Responses**

| Status | Body                                          |
|--------|-----------------------------------------------|
| 404    | `{ "error": "NOT_FOUND", "message": "Thread not found" }` |

---

### `POST /threads/:id/reply` — Reply within a thread

Sends a reply message in an existing thread.

**Path Parameters**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | string | Thread UUID |

**Request Body**

```json
{
  "body": "<p>Thanks for the update!</p>",
  "bodyType": "html",
  "to": [{ "name": "Alice", "email": "alice@example.com" }],
  "cc": [{ "name": "Bob", "email": "bob@example.com" }],
  "bcc": [],
  "attachments": [
    {
      "filename": "report.pdf",
      "mimeType": "application/pdf",
      "size": 204800,
      "content": "<base64-encoded bytes>"
    }
  ]
}
```

**Response `201 Created`**

```json
{
  "data": {
    "message": { /* EmailMessage */ },
    "thread": { /* EmailThread (updated) */ }
  }
}
```

**Validation Errors**

| Status | Body |
|--------|------|
| 400    | `{ "error": "VALIDATION_ERROR", "message": "body is required", "details": [...] }` |
| 404    | `{ "error": "NOT_FOUND", "message": "Thread not found" }` |

---

### `POST /threads` — Create a new thread

Sends the first message in a new thread.

**Request Body**

```json
{
  "subject": "Q4 Planning Meeting",
  "body": "<p>Let's schedule the Q4 planning session.</p>",
  "bodyType": "html",
  "to": [
    { "name": "Alice", "email": "alice@example.com" },
    { "name": "Bob", "email": "bob@example.com" }
  ],
  "cc": [{ "name": "Carol", "email": "carol@example.com" }],
  "bcc": [],
  "attachments": [
    {
      "filename": "agenda.md",
      "mimeType": "text/markdown",
      "size": 4096,
      "content": "<base64-encoded bytes>"
    }
  ]
}
```

**Response `201 Created`**

```json
{
  "data": {
    "thread": { /* EmailThread */ },
    "message": { /* EmailMessage */ }
  }
}
```

**Validation Errors**

| Status | Body |
|--------|------|
| 400    | `{ "error": "VALIDATION_ERROR", "message": "subject is required", "details": [...] }` |

---

## Common Error Schema

All errors follow a uniform shape:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description",
  "details": [
    { "field": "subject", "code": "REQUIRED", "message": "subject is required" }
  ]
}
```

| HTTP Status | Error Code          | Typical Use Case                |
|-------------|---------------------|---------------------------------|
| 400         | VALIDATION_ERROR    | Malformed request body          |
| 404         | NOT_FOUND           | Thread or message doesn't exist |
| 409         | CONFLICT            | Duplicate thread (Message-ID)   |
| 500         | INTERNAL_ERROR      | Unexpected server failure       |

## Thread Collation Strategy

warpSpeed groups messages into threads by:

1. **Message-ID / References / In-Reply-To headers** — Standard RFC 5322 threading.
2. **Subject normalization** — Strip `Re:`, `Fwd:`, `[prefix]` and match normalized subjects.
3. **Sender grouping** — Messages from the same sender within a time window on the same subject.

The API always returns the thread-level view; clients never see raw ungrouped messages.

## Security Considerations

- All endpoints require `Authorization: Bearer <jwt>`.
- User isolation: every query scopes to `userId` extracted from the JWT.
- Attachment uploads validate MIME type against an allow-list.
- Body size limits: 1 MB per message body, 10 MB per attachment.

## Rate Limiting

| Limit      | Window     |
|------------|------------|
| 100 req/s  | per user   |

Responds with `429 Too Many Requests` and a `Retry-After` header when exceeded.

## Pagination Cursor Alternative

For high-throughput clients, a cursor-based pagination variant is available via the `cursor` and `take` query params (instead of `page`/`limit`). The response includes `pagination.cursor` and `pagination.hasMore`.
