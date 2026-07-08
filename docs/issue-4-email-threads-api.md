# Issue #4: Email Threads API

## Bounty summary

- Issue: [#4 Email Threads API](https://github.com/warpspeedopen-source/warpspeed-bounties/issues/4)
- Reward: $750
- Difficulty: Hard
- Stack: Node.js, Prisma, TypeScript
- Estimated duration: 28h with AI / 68h unassisted

## Current repository note

This repository currently contains bounty coordination documentation only. It does
not include the Node.js, Prisma, or TypeScript application source needed to
implement the Email Threads API directly.

Before an implementation PR can be completed, contributors need access to the
application/API repository that owns the email data model, route handlers,
authentication middleware, and test suite.

## Expected API scope

The Email Threads API should let clients list, inspect, and update email
conversation threads while preserving message order, participants, unread state,
and mailbox filters.

Recommended endpoints:

- `GET /email/threads`: list threads with pagination, mailbox filters, search,
  unread filtering, and sort order.
- `GET /email/threads/:threadId`: return thread metadata plus ordered messages.
- `PATCH /email/threads/:threadId`: update thread state such as read/unread,
  archived, starred, or labels.
- `POST /email/threads/:threadId/reply`: append a reply to an existing thread
  after validating permissions and recipients.

## Data model checklist

- Thread entity with stable ID, subject, participants, latest message timestamp,
  unread count, mailbox state, and labels.
- Message entity linked to a thread with sender, recipients, sent timestamp,
  body fields, attachments metadata, and delivery status.
- Indexes for mailbox, latest message timestamp, unread state, labels, and
  participant lookup.
- Permission checks so users can only read and mutate threads they own or are
  authorized to access.

## Acceptance criteria

- Thread list supports pagination and deterministic ordering.
- Thread detail returns messages in chronological order.
- Read/unread state updates are idempotent.
- Archive and label updates preserve thread/message relationships.
- Reply creation validates sender identity, recipient list, and thread access.
- API responses use typed DTOs and avoid leaking private provider metadata.
- Prisma migrations are included for any schema changes.
- Unit or integration tests cover list, detail, update, reply, authorization,
  and empty-state behavior.

## Suggested implementation plan

1. Confirm assignment on the bounty issue before starting paid work.
2. Clone the application/API repository that owns the email backend.
3. Inspect existing auth, mailbox, message, and Prisma patterns.
4. Add or extend Prisma models and migrations for thread support.
5. Implement route handlers and service-layer thread queries.
6. Add regression tests for successful flows and authorization failures.
7. Run lint, type checks, migrations, and API tests.
8. Open a focused PR linking issue #4 with clear test notes.

## Publish guidance

A PR from this documentation repository should be titled as a documentation or
handoff update. A full bounty-completion PR requires changes in the actual
application/API codebase.
