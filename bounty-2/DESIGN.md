# Classic Inbox View — Component Architecture

## Overview

The Classic Inbox is a full-screen mail list view. It mimics a traditional email client with a sticky top navigation, scroll-hiding header, category filtering, search, and a paginated email list with read/unread visual states.

## Layout (top to bottom)

```
┌─────────────────────────────────────┐
│ TopNav (account + nav buttons)      │  ← sticky, always visible
├─────────────────────────────────────┤
│ CategoryBar (Primary/Promos/Updates)│  ← hides on scroll down
│ SearchBar (input + filter icon)     │  ← hides on scroll down
├─────────────────────────────────────┤
│ EmailList (Animated.FlatList)       │  ← scrollable, drives header hide
│   └─ EmailListItem (swipeable row)  │
│   └─ ...                            │
└─────────────────────────────────────┘
```

## Component Tree

```
App
 └─ ClassicInbox (orchestrator + Animated header)
     ├─ TopNav
     ├─ Animated.View (header group)
     │   ├─ CategoryBar
     │   └─ SearchBar
     └─ Animated.FlatList
         └─ EmailListItem (×N)
```

## Data Flow

- `inboxStore` (MobX) holds emails, categories, selected account, navigation route, search/filter state.
- `ClassicInbox` reads from store and passes props down.
- Scroll events on FlatList drive `Animated.Value` used to translate the header group up/down.
- `EmailListItem` receives `email: Email` + `onToggle` callback; uses local `Animated.Value` for swipe-to-reveal (archive/delete).
- `CategoryBar` updates store's `selectedCategory`; store recomputes `filteredEmails`.
- `SearchBar` updates store's `searchQuery`; store recomputes `filteredEmails`.

## States to handle

| Component      | Loading | Empty | Error | Edge cases              |
|----------------|---------|-------|-------|-------------------------|
| ClassicInbox   | —       | ✓     | —     | overscroll, pull-refresh|
| EmailListItem  | —       | —     | —     | long press, swipe       |
| CategoryBar    | —       | —     | —     | single category, all    |
| TopNav         | —       | —     | —     | long account name       |
| SearchBar      | —       | —     | —     | clear, debounce         |
| InboxStore     | ✓       | ✓     | ✓     | empty search results    |

## Animations

1. **Header hide/reveal**: driven by scroll offset. Threshold ~50px. At scroll > threshold, translate header group up by its own height.
2. **Swipe-to-reveal**: each `EmailListItem` wraps content in `Animated.View` with `PanResponder`.
3. **Category switch**: cross-fade or no animation (design choice — we use instant filter in store).
