# Enhanced Image Preview (Bounty #6)

This is the implementation of the Enhanced Image Preview component for warpSpeed OPEN.

## Features

- Full-screen image preview modal (via `EnhancedImagePreview`)
- Pinch-to-zoom and pan support (via `ZoomableImage` using `react-native-gesture-handler` and `react-native-reanimated`)
- Swipe navigation for multiple images (via `GallerySwiper` using `FlatList`)
- Clean separation between components:
  - `EnhancedImagePreview`: Main modal component
  - `GallerySwiper`: Handles the list of images
  - `ZoomableImage`: Handles the gesture interactions and animations
  - `ActionOverlay`: Handles UI actions (Download, Share, Delete)
- Reusable TypeScript and React Native implementation

## Requirements

- `react-native-gesture-handler`
- `react-native-reanimated`

## Usage

```tsx
import { EnhancedImagePreview } from './bounty-6/src';

// Inside your component
<EnhancedImagePreview
  visible={isVisible}
  images={[{ id: '1', url: 'https://example.com/image.jpg' }]}
  initialIndex={0}
  onClose={() => setIsVisible(false)}
  onDownload={(image) => console.log('Download', image)}
  onShare={(image) => console.log('Share', image)}
  onDelete={(image) => console.log('Delete', image)}
/>
```
