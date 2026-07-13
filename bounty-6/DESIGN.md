# Warpspeed Bounty #6 — Enhanced Image Preview

## Bounty Value
**$660**

## Goal
Build a full-screen image preview modal (lightbox) for React Native + TypeScript that supports:
- Tap to open
- Pinch-to-zoom and pan
- Swipe navigation between multiple images
- Smooth open/close transitions
- Download / share / delete actions

## Architecture

```
ImagePreview (Modal)
├── AnimatedBackdrop         — fade-in/out overlay
├── GallerySwiper            — horizontal swipe between items
│   └── ZoomableImage[]      — pinch-to-zoom + pan per image
└── ActionOverlay            — close, counter, download, share, delete
```

## State Management (MobX)
`PreviewStore` holds gallery items, current index, and visibility flag. Any screen can call `store.open(items, index)` to launch the preview.

## Gesture Strategy

| Gesture | When | Handler |
|---------|------|---------|
| Horizontal pan | scale == 1 | GallerySwiper → next/prev |
| Horizontal pan | scale > 1 | ZoomableImage → translate |
| Pinch (2 fingers) | always | ZoomableImage → scale |
| Double tap | always | ZoomableImage → toggle 2× / 1× |
| Single tap | always | ZoomableImage → toggle overlay |
| Vertical pan | scale == 1 | close modal (pull-down) |

> **Zoom takes priority**: while an image is zoomed in, the swiper is locked so pans don't change pages.

## Key Design Decisions

1. **Pure React Native** — no `react-native-gesture-handler` or `react-native-reanimated` dependency. Uses `PanResponder` and `Animated` from RN core so the implementation works out of the box.
2. **FlatList for swiping** — `horizontal` + `pagingEnabled` + `scrollEnabled` toggle gives us swipe navigation with zero extra code. We toggle `scrollEnabled` off when the current image is zoomed in.
3. **Animated values, not state** — zoom & pan use `Animated.Value` for 60fps gesture feedback.
4. **Clamped transformations** — scale is clamped to `[1, 5]`, translation is bounded so image edges don't drift past screen edges.
5. **MobX** — lightweight observable store for preview state.

## Data Flow

```
User taps thumbnail
  → Screen calls previewStore.open(items, index)
    → ImagePreview modal renders
      → GallerySwiper renders items
        → ZoomableImage handles scale/translate
      → ActionOverlay shows actions
User taps close / swipes last item / pulls down
  → previewStore.close()
    → Modal unmounts
```

## File Structure

```
components/
  ImagePreview.tsx      — Modal orchestrator
  ZoomableImage.tsx     — Pinch-to-zoom + pan
  GallerySwiper.tsx     — Swipe navigation
  ActionOverlay.tsx     — Action buttons overlay
state/
  previewStore.ts       — MobX store
types.ts                — Shared TypeScript types
README.md               — Usage guide
DESIGN.md               — This file
```
