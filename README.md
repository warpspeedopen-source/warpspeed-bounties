# warpSpeed Bounties

Paid open-source bounty tasks for developers contributing to **warpSpeed OPEN**.

Developers can browse open bounties, sign up on the website, claim a GitHub issue, submit a pull request, and receive payment after the PR is approved and merged.

## Quick Links

- Website: https://warpspeedopen.org
- Bounties: https://warpspeedopen.org/bounties
- Developer Signup: https://warpspeedopen.org/signup
- Discord: Add Discord invite link here
- Community Repo: Add `warpspeed-community` repo link here

## How the bounty process works

1. Browse available bounty tasks.
2. Sign up on the warpSpeed OPEN website.
3. Comment on the GitHub bounty issue to request assignment.
4. Wait for maintainer confirmation before starting paid work.
5. Fork the repository and create your branch.
6. Submit your pull request.
7. Respond to review comments.
8. Get paid after the PR is approved and merged.

## Bounty categories

- Frontend UI
- React Native
- Node.js API
- Prisma / database work
- TypeScript
- AI productivity features
- Documentation
- Integrations

## Important payment rule

Bounties are paid only after the work is approved and the pull request is merged.



<!-- Fix for issue #4 -->
```typescript
// src/modules/threads/threads.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Thread, Message, Prisma } from '@prisma/client';
import { ListThreadsDto } from './dto/list-threads.dto';
import { ThreadDetailDto } from './dto/thread-detail.dto';
import { MessageFilterDto } from '../messages/dto/message-filter.dto';

@Injectable()
export class ThreadsService {
  constructo
