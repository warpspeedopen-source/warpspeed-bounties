# Warpspeed Bounty #3 — Poll Creation & Voting UI — Design

## Architecture Overview

```
Chat UI
  └─ Action Menu ("+") ──> PollCreationSheet
                                │
                          PollStore.createPoll()
                                │
                          Chat Message (InlinePoll)
                                │
                    ┌───────────┴───────────┐
               PollVoting             PollResults
               (not voted)            (voted)
                                          │
                                    ViewVotesSheet
```

The poll feature integrates directly into the group chat message list. Each poll is rendered as an `InlinePoll` card. Before the current user votes, the card shows `PollVoting` (interactive options). After voting, it swaps to `PollResults` (read-only bars with percentages). A "View Votes" button opens the `ViewVotesSheet` bottom sheet listing every voter grouped by option.

## Component Responsibilities

| Component | Role |
|---|---|
| `PollCreationSheet` | Bottom sheet modal — question input, dynamic option list (2–12), single/multi toggle, create action. |
| `InlinePoll` | Container card in the chat — header badge, question, delegates to `PollVoting` or `PollResults`. |
| `PollVoting` | Radio buttons (single) or checkboxes (multi) — selection state, submit vote. |
| `PollResults` | Horizontal result bars, percentages, vote counts, leading-option crown, "View Votes" trigger. |
| `ViewVotesSheet` | Bottom sheet with `SectionList` — each option is a section, voters listed with avatar + timestamp. |

## Data Flow

1. User taps the "+" action button in chat input → `PollCreationSheet` opens.
2. User fills in question + options + toggles multi/single → taps "Create Poll".
3. `PollStore.createPoll()` is called → returns a `Poll` object stored in the MobX store.
4. A chat message containing the `InlinePoll` component is inserted into the message list.
5. User taps options → `PollVoting` manages local selection state → "Vote" button calls `PollStore.castVote()`.
6. `castVote` adds the user's `Vote` record to each selected option's `voters` array and sets `poll.userVote`.
7. Because `poll.userVote` becomes defined, `InlinePoll` automatically swaps to `PollResults`.
8. `PollResults` reads option voters via `getResults()` which computes percentages, leading option, etc.
9. "View Votes" fires a callback that renders `ViewVotesSheet` with the same data, grouped by option.

## State Management (MobX)

`PollStore` is a singleton MobX store with `makeAutoObservable`:

- `polls: Map<string, Poll>` — observable map of all polls in the session.
- `createPoll(data, createdBy)` — generates IDs, builds `PollOption[]`, stores poll.
- `castVote(pollId, optionIds, userId, username)` — validates, pushes `Vote` objects, sets `userVote`.
- `getResults(pollId)` — derived array of `PollResult` with percentages.
- `hasUserVoted(pollId)` — convenience getter.

Votes are **immutable** once cast (one user = one vote). Multi-choice allows selecting multiple options in a single submission.

## Styling Approach

- Dark theme (matching Warpspeed's iOS aesthetic): `#1C1C1E` surfaces, `#2C2C2E` inputs, `#FFFFFF` text, `#8E8E93` secondary.
- Accent: `#0A84FF` (iOS blue) for selected states, buttons.
- 12-color palette (`POLL_COLORS`) for result bars — distinct enough to differentiate options.
- Bottom sheets use `borderTopLeftRadius: 16` / `borderTopRightRadius: 16` with a drag handle indicator.
- All touch targets are ≥44px height for accessibility.
- `SectionList` in `ViewVotesSheet` groups voters by option with a colored dot per section header.

## Edge Cases

- **Multi-choice toggle**: `PollCreationSheet` shows `Switch`; `PollVoting` renders checkboxes when true.
- **Empty poll vote**: "View Votes" shows "No votes yet" empty state.
- **255 char limit**: enforced on each option input; question limit of 500 chars.
- **Min 2 / Max 12 options**: creation sheet disables add/remove at boundaries.
- **Leading option**: `PollResults` shows a crown emoji next to the leading option(s); ties are handled (multiple leaders).
- **User's own vote**: highlighted with blue text + a blue dot indicator on the result bar.
- **Single choice re-selection**: tapping the same radio button deselects it (allows un-selection before submit).

## Future Considerations

- API integration: replace MobX store with socket events, persist polls server-side.
- Poll expiry: add `endsAt` timestamp + auto-close + "Poll closed" state.
- Edit poll: allow creator to add options before voting starts.
- Anonymous polls: hide usernames in results.
- Reactions: add emoji reactions on poll cards.
