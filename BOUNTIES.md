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

This document outlines the bounty program for warpSpeed OPEN.

## Available Bounties

- **[PAID BOUNTY - $660] Inline Image Editing** - Build an inline image editing feature for the warpSpeed app.

## Bounty Overview

Build an inline image editing feature for the warpSpeed app.

This bounty allows users to make quick, lightweight image edits directly inside the app without exporting images to another tool. From the image preview, users should be able to open an editor, crop, rotate, adjust basic image settings, and add simple annotations.

Edited images must be saved as a new version while keeping the original image intact.

## Reward

$660

## Difficulty

Medium

## Main Skills

* React Native
* TypeScript
* Image Editing UI
* Mobile Interaction Design
* Notes / Messenger UI Flow
* Reusable Component Architecture

## Design Reference

https://xd.adobe.com/view/1ed5f38b-2e22-4086-b041-6922a0313bf6-4b86/

## High-Level Scope

The selected developer will build an inline image editor that supports quick image modifications inside the app.

The implementation should include:

* Edit button from image preview
* Inline image editor screen or modal
* Crop and rotate tools
* Brightness, contrast, and saturation adjustments
* Simple annotations such as pen, text, arrows, and highlights
* Undo and redo functionality
* Save edited image as a new version
* Preserve original image without overwriting it
* Notes behaviour: edited image replaces the original image inside the note context
* Messenger behaviour: edited image can be sent as a new message with an "(Edited)" label if edited within 15 minutes of the original send
* Clean separation between editor UI, image processing layer, and shared helpers
* Reusable TypeScript and React Native implementation

## View Full Bounty Details & Sign Up

To see the full bounty specification and apply, visit:

https://warpspeedopen.org/bounties

## How to Claim

1. Open the bounty page.
2. Sign up as a developer.
3. Return to this GitHub issue and comment:

   "I have signed up and would like to claim this bounty."

4. A maintainer must confirm before work begins.

## Important Rules

* Do not start work until a maintainer confirms your claim.
* Maximum 3 submission attempts.
* Minimum 90% specification match required for consideration.
* Payment is made only at 100% completion.
* Payment is processed only after the pull request is approved and merged.
* First code commit is required at the halfway mark between bounty start and bounty expiration.
* Code must be original or properly licensed.
* The official bounty page is the source of truth for full requirements, rules, and deadlines.

## Submission Process

1. Fork the repository
2. Create a branch with the naming convention: `bounty/inline-image-editing`
3. Implement the feature according to specifications
4. Ensure all code follows project coding standards
5. Submit a pull request with a detailed description of changes
6. Address any review feedback

## Questions?

For questions about this bounty, please contact the warpSpeed OPEN team through the official website or Discord.
Payment happens after the PR is approved and merged.
