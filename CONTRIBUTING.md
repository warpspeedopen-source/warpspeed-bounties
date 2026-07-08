# Contributing to warpSpeed Bounties

Thank you for your interest in contributing to warpSpeed OPEN.

## Before you start

Please do not begin paid bounty work until a maintainer confirms your assignment.

## Claiming a bounty

1. Open the bounty issue.
2. Sign up on the website: https://warpspeedopen.org/signup
3. Comment on the issue: `I have signed up and would like to claim this bounty.`
4. Wait for maintainer confirmation.
5. Start work only after confirmation.

## Pull request rules

- Keep the PR focused on the bounty scope.
- Include clear screenshots or videos for UI work.
- Include test notes where possible.
- Link the bounty issue in the PR description.
- Do not include secrets, API keys, or private credentials.

## Review and payment

Payment is processed only after:

- the submitted PR meets the acceptance criteria,
- maintainers approve it,
# Contributing to warpSpeed Bounties

Thank you for your interest in contributing to warpSpeed OPEN! This document outlines how to participate in our bounty program and contribute code.

## Bounty Contribution Process

### 1. Find a Bounty

Browse open bounties at [https://warpspeedopen.org/bounties](https://warpspeedopen.org/bounties) or check the [BOUNTIES.md](./BOUNTIES.md) file for active bounties.

### 2. Sign Up

Register as a developer on the warpSpeed OPEN website before claiming any bounty.

### 3. Claim the Bounty

To claim a bounty:

1. Open the bounty page and review full technical requirements
2. Comment on the GitHub issue: **"I have signed up and would like to claim this bounty."**
3. Wait for **maintainer confirmation** before starting work
4. Once confirmed, fork the repository and create your feature branch

> ⚠️ **Important**: Do not start work until a maintainer confirms your claim.

### 4. Development Guidelines

#### Email Threads API Specific Guidelines

When working on the Email Threads API bounty, please adhere to the following:

- **Thread-first architecture**: All email operations should treat the thread as the primary entity
- **Backward compatibility**: Existing message API endpoints must continue to function
- **Access control**: Respect existing ownership and permission models
- **Draft handling**: Drafts must be included in their correct conversation thread
- **Sync compatibility**: Gmail, Outlook, and IMAP sync must update thread ordering correctly

#### Code Standards

- Use **TypeScript** for all new code
- Follow existing **Prisma** schema conventions
- Write **Jest tests** for all new endpoints and business logic
- Document all endpoints with **Swagger/OpenAPI**
- Maintain >90% test coverage for new features

#### Database Schema Considerations

When modifying the Prisma schema for thread support:


- and the PR is merged.
