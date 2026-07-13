# Warpspeed Bounty #6 — Enhanced Image Preview

**Value:** $660

## Overview

A full-screen image preview modal (lightbox) for React Native + TypeScript. Supports pinch-to-zoom, pan, swipe navigation, and download/share/delete actions. Built with zero external gesture dependencies — uses only `PanResponder` and `Animated` from React Native core.

## Features

- ✅ Full-screen modal lightbox
- ✅ Tap thumbnail to open
- ✅ Pinch-to-zoom (2 fingers)
- ✅ Pan when zoomed in
- ✅ Double-tap to zoom in/out at focal point
- ✅ Horizontal swipe between multiple images
- ✅ Smooth open/close fade transitions
- ✅ Download / Share / Delete action buttons
- ✅ Image counter (e.g., "3 / 8")
- ✅ Zoomed images lock swiping (no accidental page turns)
- ✅ Lightweight — no external gesture libraries needed

## File Structure

```
components/
  ImagePreview.tsx      — Modal that orchestrates everything
  ZoomableImage.tsx     — Pinch-to-zoom + pan gesture handling
  GallerySwiper.tsx     — FlatList-based horizontal swipe
  ActionOverlay.tsx     — Close / counter / download / share / delete
state/
  previewStore.ts       — MobX store for preview state
types.ts                — GalleryItem, PreviewState, ZoomLevel
```

## Quick Start

```tsx
import React from 'react'
import { Button } from 'react-native'
import ImagePreview from './components/ImagePreview'
import type { GalleryItem } from './types'

const images: GalleryItem[] = [
  { id: '1', uri: 'https://example.com/photo1.jpg', filename: 'photo1.jpg' },
  { id: '2', uri: 'https://example.com/photo2.jpg', filename: 'photo2.jpg' },
]

const GalleryScreen = () => {
  const [visible, setVisible] = React.useState(false)

  return (
    <>
      <Button title="Open Gallery" onPress={() => setVisible(true)} />

      <ImagePreview
        visible={visible}
        items={images}
        initialIndex={0}
        onClose={() => setVisible(false)}
        onDownload={(item) => console.log('Download', item.filename)}
        onShare={(item) => console.log('Share', item.filename)}
        onDelete={(item) => console.log('Delete', item.id)}
      />
    </>
  )
}
```

## Using with MobX (optional)

```tsx
import { observer } from 'mobx-react-lite'
import previewStore from './state/previewStore'

const App = observer(() => (
  <ImagePreview
    visible={previewStore.isVisible}
    items={previewStore.items}
    initialIndex={previewStore.currentIndex}
    onClose={() => previewStore.close()}
    onDownload={handleDownload}
    onShare={handleShare}
    onDelete={handleDelete}
  />
))

// Open from anywhere:
previewStore.open(galleryItems, 3)
```

## Props

### ImagePreview

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | ✅ | Show/hide modal |
| `items` | `GalleryItem[]` | ✅ | Image list |
| `initialIndex` | `number` | ❌ | Start at this index (default `0`) |
| `onClose` | `() => void` | ✅ | Dismiss callback |
| `onDownload` | `(item) => void` | ❌ | Download action |
| `onShare` | `(item) => void` | ❌ | Share action |
| `onDelete` | `(item) => void` | ❌ | Delete action |
| `renderLoader` | `(item) => ReactElement` | ❌ | Custom loader/placeholder |

### GalleryItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ | Unique identifier |
| `uri` | `string` | ✅ | Image source URI |
| `thumbnailUri` | `string` | ❌ | Thumbnail for placeholder |
| `type` | `'image' \| 'video'` | ❌ | Media type |
| `filename` | `string` | ❌ | Original file name |
| `metadata` | `Record<string, unknown>` | ❌ | Arbitrary metadata |

## Gesture Reference

| Gesture | Action |
|---------|--------|
| Single tap | Toggle action overlay |
| Double tap | Zoom in at tap point / zoom out |
| Pinch (2 fingers) | Zoom in / out |
| Pan (1 finger, zoomed) | Move image |
| Swipe (1 finger, not zoomed) | Next / previous image |

## Customization

- Replace emoji icons in `ActionOverlay.tsx` with your own `Image` or icon component.
- Adjust `MAX_SCALE` and `MIN_SCALE` constants in `ZoomableImage.tsx`.
- Override `styles` in each component for custom theming.
- Pass `renderLoader` to `ImagePreview` for skeleton placeholders while images load.

## Dependencies

- `react-native` (>= 0.72)
- `mobx` + `mobx-react-lite` (optional — only needed if using `previewStore.ts`)
- TypeScript

## License

MIT
