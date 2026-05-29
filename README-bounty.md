# Email Threads API

This project implements the thread-first Email Threads API for warpSpeed.

## Features implemented:
*   Listing email threads for the authenticated user (`GET /api/threads`)
*   Opening a single thread and returning thread metadata with related messages (`GET /api/threads/:id`)
*   Grouping filtered/search results by thread (using `search` query parameter in `listThreads`)
*   Preserving ownership and access control rules (enforced by `x-user-id` header matching `ownerId`)
*   Including drafts in the correct conversation thread ( drafts are saved in the `Message` table with `isDraft=true` and `threadId`)
*   Excluding archived and deleted messages where required
*   Updating thread recency when drafts are created (`POST /api/threads/:id/drafts` updates `lastActivity`)
*   Adding Swagger/API documentation (`/api-docs` endpoint)
*   Adding Jest tests for auth, ordering, filters, drafts, and thread detail behaviour (tests mocked with Prisma)

## Tech Stack
*   Node.js
*   TypeScript
*   Express
*   Prisma (SQLite for development)
*   Jest & Supertest

## How to run
1.  Run `npm install`
2.  Run `npx prisma generate` and `npx prisma db push`
3.  Run tests `npm test`
4.  Start server `npm run dev`
