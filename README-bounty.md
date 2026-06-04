# Email Threads API — warpSpeed

Thread-first email API for the warpSpeed app. Groups messages into conversations, supports Gmail/Outlook/IMAP sync, draft recency, search/filter grouping, and proper access control.

## Features

- **Thread listing** — paginated, searchable, filterable by folder (inbox, drafts, archived, deleted, all)
- **Thread detail** — full message history in chronological order
- **Draft management** — create drafts in the correct conversation, send them when ready
- **Provider sync** — import from Gmail, Outlook, and IMAP with dedup and correct threading
- **Out-of-order handling** — late-arriving provider messages don't break thread ordering
- **Swagger docs** — full OpenAPI 3.0 specification at `/api-docs`

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/threads` | List threads (search, filter, paginate) |
| GET | `/api/threads/:id` | Get thread with messages |
| POST | `/api/threads/:id/drafts` | Create draft in thread |
| POST | `/api/threads/:id/drafts/:draftId/send` | Send a draft |
| POST | `/api/threads/provider/sync` | Import provider message |
| GET | `/api-docs` | Swagger UI |

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client and create SQLite DB
npx prisma generate
npx prisma db push

# Run tests
npm test

# Start server
npm run dev
```

## Auth

All endpoints require authentication via the `x-user-id` header (derived from the warpSpeed app session). In production, this is replaced with JWT/session token validation.

## Query Parameters (GET /api/threads)

| Param | Type | Default | Description |
|---|---|---|---|
| `search` | string | — | Search across subject and body |
| `folder` | string | `inbox` | `inbox`, `drafts`, `archived`, `deleted`, `all` |
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 100) |

## Project Structure

```
email-threads-api/
├── prisma/
│   └── schema.prisma       # SQLite schema with Thread, Message, User models
├── src/
│   ├── index.ts            # Express app + Swagger/OpenAPI spec
│   ├── types.ts            # Zod schemas + TypeScript types
│   ├── middleware/
│   │   └── auth.ts         # Auth context middleware
│   ├── controllers/
│   │   └── threadsController.ts
│   ├── routes/
│   │   └── threads.ts      # Express router
│   ├── services/
│   │   └── threadsService.ts  # Core business logic
│   └── __tests__/
│       └── threads.test.ts    # 20+ test cases
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Test Coverage

- Auth (missing/empty x-user-id)
- List threads (pagination, search, folder filters, validation)
- Get thread (found, not found, ownership enforcement, message ordering)
- Drafts (create, send, not found, validation)
- Provider sync (import, dedup, out-of-order handling)
