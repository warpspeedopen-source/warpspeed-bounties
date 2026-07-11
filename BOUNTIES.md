# Open Bounties

This file lists the bounty tasks currently visible on the warpSpeed OPEN bounty page.

| Bounty | Reward | Difficulty | Stack | Status | Signup Capacity | Timeline | Estimated Duration |
|---|---:|---|---|---|---|---|---|
| Attachment Summarizer Service | $960 | Expert | Node.js, Prisma, TypeScript | Open | 66% full | 5/11/2026 – 6/11/2026 | 32h with AI / 80h unassisted |
| Email inbox (classic view) page UI | $330 | Medium | React Native, TypeScript | Open | 100% full | 4/25/2026 – 5/30/2026 | 6h with AI / 6h unassisted |
| Messenger Group Chat Poll Creation & Voting UI | $440 | Medium | React Native, TypeScript | Open | 66% full | 4/24/2026 – 5/29/2026 | 8h with AI / 8h unassisted |
| Email Threads API | $750 | Hard | Node.js, Prisma, TypeScript | Open | 50% full | 4/26/2026 – 5/26/2026 | 28h with AI / 68h unassisted |
| Inline image editing | $660 | Medium | TypeScript, React Native | Open | 100% full | 12/12/2025 – 3/19/2026 | 12h with AI / 12h unassisted |
| Enhanced image preview | $660 | Medium | TypeScript, React Native | Open | 100% full | 12/12/2025 – 3/17/2026 | 12h with AI / 12h unassisted |
| Note Locking (Biometrics/PIN) | $660 | Medium | TypeScript, React Native | Open | 66% full | 12/8/2025 – 3/18/2026 | 12h with AI / 12h unassisted |
| Audio note recording | $750 | Hard | TypeScript, React Native | Open | 100% full | 12/12/2025 – 3/18/2026 | 8h with AI / 8h unassisted |

## How to claim

1. Open the relevant bounty issue.
2. Sign up as a developer: https://warpspeedopen.org/signup
3. Comment on the issue saying you want to claim it.
4. Wait for maintainer approval before starting paid work.

## Payment condition

# warpSpeed Bounties

This document tracks active and completed bounty tasks for the warpSpeed OPEN developer programme.

## Active Bounties

### Messenger Group Chat Poll Creation & Voting UI

| Field | Details |
|-------|---------|
| **Bounty ID** | WARP-POLL-001 |
| **Reward** | $440 |
| **Status** | 🟢 Open |
| **Difficulty** | Medium |
| **Category** | Frontend UI, React Native, TypeScript |
| **Skills** | React Native, TypeScript, Storybook, UI Components, Mobile Interaction Design, Real-time UI States |

#### Description

Build a poll creation and voting feature for group chats in the warpSpeed app. The feature should allow users to create polls directly from the group chat input area, send polls inline into the conversation, vote on options, view real-time results, and open a detailed "View Votes" bottom sheet.

#### Technical Requirements

- **Poll Creation**
  - Access poll creation from group chat input action/arrow menu
  - Poll question input with 255 character limit
  - Multiple answer options (up to 12 options)
  - Single-choice or multiple-choice voting support
  
- **Poll Display**
  - Inline poll message inside chat conversation
  - Persistent poll display in chat history
  - Visual result bars or progress indicators
  - Vote percentage calculation based on total group participants
  
- **Voting Experience**
  - Direct voting from the chat
  - Real-time result updates
  - "View Votes" action to open detailed view
  
- **Bottom Sheet**
  - Detailed voting insights
  - Voter profile previews
  - Detailed voter list per option

- **Storybook**
  - Reusable poll components
  - Composed view for full user experience

#### Design Reference

[Adobe XD Design Mockup](https://xd.adobe.com/view/0cec7f20-eb33-402e-be87-f7e02753e028-59bf/)

#### Acceptance Criteria

- [ ] Poll creation accessible from group chat input menu
- [ ] Poll question supports up to 255 characters
- [ ] Up to 12 poll options supported
- [ ] Single and multiple choice voting modes
- [ ] Inline poll rendering in chat messages
- [ ] Real-time vote result updates
- [ ] Visual progress bars for results
- [ ] Percentage calculation based on group participants
- [ ] "View Votes" bottom sheet with detailed insights
- [ ] Voter profile previews and per-option voter lists
- [ ] Polls persist in chat history
- [ ] Storybook stories for all components
- [ ] Minimum 90% specification match

#### Submission Rules

1. Do not start work until a maintainer confirms your claim
2. Maximum 3 submission attempts
3. Minimum 90% specification match required for consideration
4. Payment made only at 100% completion
5. Payment processed after PR approval and merge
6. First code commit required at halfway mark between bounty start and expiration
7. Code must be original or properly licensed

#### How to Claim

1. Visit [warpSpeed Bounties](https://warpspeedopen.org/bounties)
2. Sign up as a developer
3. Review full bounty details and rules
4. Comment on the GitHub issue: *"I have signed up and would like to claim this bounty."*
5. Wait for maintainer confirmation before starting work

---

## Completed Bounties

*No completed bounties yet.*

---

## Bounty Status Legend

| Status | Meaning |
|--------|---------|
| 🟢 Open | Available for claiming |
| 🟡 Claimed | Assigned to a developer |
| 🟠 In Review | PR submitted, under review |
| 🔵 Completed | Approved and merged |
| ⚫ Cancelled | Bounty cancelled or expired |

---

*For questions about bounties, contact the warpSpeed OPEN team or visit [warpSpeedopen.org](https://warpspeedopen.org).*
Payment happens after the PR is approved and merged.
