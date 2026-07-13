# Email Threads API — Implementation Guide

## Stack

| Layer      | Technology                         |
|------------|------------------------------------|
| Runtime    | Node.js 20+                        |
| Framework  | Express 4.x                        |
| ORM        | Prisma 5.x                         |
| Database   | PostgreSQL 15+                     |
| Auth       | JWT (Bearer token via middleware)  |
| Storage    | S3-compatible (for attachments)    |

## Project Structure

```
src/
  routes/
    threads.ts          ← mount the exported router from api.ts
  middleware/
    auth.ts             ← JWT verification, sets req.user
  services/
    storage.ts          ← attachment upload / signed-URL generation
    threading.ts        ← thread collation logic (Message-ID / References)
  types/
    index.ts            ← re-export from types.ts
prisma/
  schema.prisma
```

## Getting Started

```bash
# 1. Install dependencies
npm install express @prisma/client uuid
npm install -D typescript @types/express @types/node ts-node

# 2. Set up database
createdb warpspeed_email
cp .env.example .env    # fill in DATABASE_URL

# 3. Run migrations
npx prisma migrate dev --name init

# 4. Generate Prisma client
npx prisma generate

# 5. Start dev server
ts-node src/index.ts
```

## Environment Variables

| Variable        | Required | Default                   |
|-----------------|----------|---------------------------|
| `DATABASE_URL`  | yes      | —                         |
| `JWT_SECRET`    | yes      | —                         |
| `PORT`          | no       | `3000`                    |
| `STORAGE_BUCKET`| yes      | —                         |

## Mounting the Router

```ts
// src/index.ts
import express from 'express'
import threadsRouter from './routes/threads'

const app = express()
app.use(express.json({ limit: '10mb' }))
app.use('/api/v1/threads', threadsRouter)
app.listen(3000)
```

## Testing with curl

```bash
# List threads
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/threads

# List threads with filters
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/threads?category=inbox&page=1&limit=10"

# Open a thread
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/threads/<thread-id>

# Reply in a thread
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body":"<p>Got it, thanks!</p>","bodyType":"html","to":[{"name":"Alice","email":"alice@example.com"}]}' \
  http://localhost:3000/api/v1/threads/<thread-id>/reply

# Create a new thread
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Hello","body":"<p>World</p>","bodyType":"html","to":[{"name":"Alice","email":"alice@example.com"}]}' \
  http://localhost:3000/api/v1/threads
```

## Migration Workflow

```bash
npx prisma migrate dev --name add_label_index    # create migration
npx prisma migrate deploy                        # apply in production
```

## Key Design Decisions

1. **Participants as a separate table** — Enables efficient search by participant email and avoids JSON bloat for indexed queries.
2. **`to`/`cc`/`bcc` as JSON on Message** — These are write-once, read-often arrays; normalizing them into join tables adds complexity for marginal gain.
3. **Thread collation at write time** — When a message arrives, the system checks for an existing thread by Message-ID or normalized subject and groups accordingly. The API surface is always thread-first.
4. **`snippet` denormalized on Thread** — Avoids a full-text scan of all messages for the list view.
