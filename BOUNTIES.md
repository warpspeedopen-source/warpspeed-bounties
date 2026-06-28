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

This document tracks active and completed bounty tasks for the warpSpeed OPEN ecosystem.

## Active Bounties

### Note Locking - Biometrics/PIN

| Field | Details |
|-------|---------|
| **Bounty ID** | WARP-2024-001 |
| **Reward** | $660 |
| **Status** | 🟡 Open - Awaiting Developer Assignment |
| **Difficulty** | Medium |
| **Skills** | React Native, TypeScript, Biometric Authentication, Secure UI States |

#### Description

Build note-level locking for the warpSpeed Notes experience using biometrics, device authentication, or a user-defined PIN.

This bounty gives users a private vault inside Notes. Users should be able to lock new or existing notes, clearly see which notes are locked, and unlock them only after successful authentication.

#### Requirements

- [ ] Ability to lock a new note
- [ ] Ability to lock an existing note
- [ ] Authentication using Face ID, Touch ID, fingerprint, device PIN, or user-defined PIN where supported
- [ ] Clear locked-note state in the UI
- [ ] Locked notes hidden or obscured until authentication succeeds
- [ ] Secure lock screen for unauthenticated access attempts
- [ ] No note content revealed before successful unlock
- [ ] Re-authentication after app restart
- [ ] Re-authentication after a configurable timeout period
- [ ] Ability to remove a note lock through note settings
- [ ] Ability to change lock settings through note settings
- [ ] Authentication required before removing or changing a lock
- [ ] Clear UI indicators such as lock icons or labels
- [ ] Clean separation between authentication layer, note-locking logic, and UI components
- [ ] Reusable TypeScript and React Native implementation that can be extended later

#### Technical Architecture


Payment happens after the PR is approved and merged.
