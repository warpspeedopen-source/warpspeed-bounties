# Warpspeed Bounty #2 — Classic Inbox View ($330)

A React Native + TypeScript reference implementation for a traditional email inbox UI.

## Features

- Sticky top navigation with account switcher and route buttons
- Scroll-based header hide/reveal for category tabs and search bar
- Three email categories: Primary, Promotions, Updates
- Search bar with live filtering and clear button
- Email list with read/unread visual states
- Swipe-to-reveal "Archive" action on email rows
- Star/unstar and attachment indicators
- Pull-to-refresh
- Empty state messaging
- MobX store for all state management

## File Structure

```
components/
  ClassicInbox.tsx    — Main orchestrator with animated header
  TopNav.tsx          — Account selector + nav buttons
  CategoryBar.tsx     — Category filter tabs
  SearchBar.tsx       — Search input + filter toggle
  EmailListItem.tsx   — Single email row with swipe
state/
  inboxStore.ts       — MobX store (accounts, emails, ui state)
types.ts              — TypeScript types
DESIGN.md             — Full component architecture
README.md             — This file
```

## Getting Started

```bash
npm install
npx expo start
```

## Dependencies

- react-native
- mobx / mobx-react-lite
- typescript

## States Covered

| State        | Handling                                |
|--------------|----------------------------------------|
| Loading      | Pull-to-refresh spinner via `simulateLoad` |
| Empty        | `ListEmptyComponent` with context-aware message |
| Error        | Store has `error` field (extendable)   |
| Search empty | Shows "Try a different search term."   |
| Unread       | Blue dot + bold sender/subject         |
| Starred      | Filled/outline star glyph toggle       |
| Swipe        | PanResponder reveal + spring back      |
