# Warpspeed Bounty #3 — Group Chat Poll Creation & Voting UI

**Bounty Amount:** $440  
**Category:** React Native / TypeScript / MobX  
**Status:** ✅ Reference Implementation

## Overview

A complete, production-ready reference implementation of the Warpspeed Group Chat Poll Creation & Voting feature. Users can create polls directly from the chat input action menu, vote on polls, view real-time results with percentage bars, and inspect voter details per option in a bottom sheet.

## Files

| File | Purpose |
|---|---|
| `types.ts` | All TypeScript interfaces (`Poll`, `PollOption`, `Vote`, `PollResult`) and constants |
| `state/pollStore.ts` | MobX store with `createPoll`, `castVote`, `getResults` |
| `components/PollCreationSheet.tsx` | Bottom sheet for creating polls (question + 2–12 options, single/multi) |
| `components/InlinePoll.tsx` | Poll card rendered inline in chat messages |
| `components/PollVoting.tsx` | Interactive voting (radio / checkbox select, submit) |
| `components/PollResults.tsx` | Result bars with percentages, leading option, vote counts |
| `components/ViewVotesSheet.tsx` | Bottom sheet listing voters grouped by option |
| `DESIGN.md` | Architecture overview, component tree, data flow, styling, edge cases |

## Usage

```tsx
import { pollStore } from './state/pollStore';
import { InlinePoll } from './components/InlinePoll';
import { PollCreationSheet } from './components/PollCreationSheet';

// 1. Show creation sheet
<PollCreationSheet
  visible={showCreation}
  onClose={() => setShowCreation(false)}
  onCreate={(data) => {
    const poll = pollStore.createPoll(data, currentUserId);
    appendMessage({ type: 'poll', pollId: poll.id });
  }}
/>

// 2. Render inline poll in chat
<InlinePoll
  poll={pollStore.getPoll(pollId)!}
  currentUserId={currentUserId}
  currentUsername={currentUsername}
  onVote={(pollId, optionIds) =>
    pollStore.castVote(pollId, optionIds, currentUserId, currentUsername)
  }
  onViewVotes={(pollId) => setViewingPollId(pollId)}
/>

// 3. View votes bottom sheet
<ViewVotesSheet
  visible={viewingPollId !== null}
  poll={viewingPollId ? pollStore.getPoll(viewingPollId) : null}
  onClose={() => setViewingPollId(null)}
/>
```

## Key Features

- **Poll Creation**: Bottom sheet with question + 2–12 options (255 char limit each), single/multi-choice toggle
- **Inline Poll**: Chat-native card with question, options, voting controls
- **Direct Voting**: Radio buttons (single) / checkboxes (multi), submit vote
- **Real-Time Results**: Animated bars, percentages, vote counts, leading-option crown
- **View Votes**: SectionList grouped by option with voter avatars and timestamps
- **MobX State Management**: Observable store with auto-computed results
- **Dark Theme**: iOS-style dark mode design system

## Dependencies

- `react-native` (≥0.72)
- `mobx` (≥6.10) + `mobx-react-lite`
- TypeScript (≥5.0)

No third-party UI libraries required — all components use React Native core primitives.
