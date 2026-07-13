# Bounty #5 — Inline Image Editor

**Prize: $660**

A React Native + TypeScript reference implementation for inline image editing inside a messenger-style chat.

## Features

- **Edit from preview** — tap the "Edit" button on an image preview to open the editor modal
- **Crop + Rotate** — rotate via a slider; crop by dragging corners
- **Adjustments** — brightness, contrast, and saturation sliders (0%–200%)
- **Annotations** — pen (freehand), text labels, arrows, and highlight rectangles
- **Undo / Redo** — full undo/redo stack for every action
- **Save as new version** — original image is preserved; edited copy is saved
- **"Edited" label** — messenger bubble shows an "Edited" badge

## Architecture

```
src/
├── types.ts                       # EditOperation, Annotation, ImageState
├── state/editorStore.ts           # MobX store — undo/redo stack, all edit state
├── components/
│   ├── ImageEditor.tsx            # Main modal — tool toggling, header, canvas
│   ├── CropTool.tsx               # Crop rectangle + rotation slider
│   ├── AdjustPanel.tsx            # Brightness/contrast/saturation sliders
│   ├── AnnotationToolbar.tsx      # Color picker, size/width controls
│   └── UndoRedoBar.tsx            # Undo / Redo buttons
```

## Usage

```tsx
import { getEditorStore } from './state/editorStore';

const store = getEditorStore();

// Open the editor with an image
store.openEditor({
  uri: 'file:///path/to/image.jpg',
  width: 1920,
  height: 1080,
  cropRect: null,
  rotation: 0,
  brightness: 1,
  contrast: 1,
  saturation: 1,
  annotations: [],
});

// Render the modal somewhere in your app tree
<ImageEditor />
```

## Dependencies

- `react-native` (≥0.72)
- `mobx` (≥6)
- `mobx-react-lite` (≥4)
- `@react-native-community/slider` (for sliders)

## Undo/Redo

Every state mutation (rotation, brightness, annotation add, etc.) automatically pushes the current `ImageState` onto the undo stack. Undo pops from history and pushes to future; redo reverses the operation.

## Image Persistence

The actual bitmap composition (crop + rotate + adjustments + annotations → final file) is intentionally left as a TODO — a production implementation would use `react-native-view-shot` or a native module to render the layers into a single PNG/JPEG.
