# Inline Image Editor — Design Document

## Overview

**Bounty #5** — Provide an inline image editor inside a chat/messenger UI so users can edit images before sending. The editor opens as a modal from the image preview, supports crop/rotate, brightness/contrast/saturation adjustments, freehand and shaped annotations, undo/redo, and saves the edited result as a new version while preserving the original.

## User Flow

1. User taps image preview → Edit button appears
2. Tap Edit → `ImageEditor` modal opens with the current image
3. User applies one or more edits:
   - Crop + Rotate (drag corners, rotate slider)
   - Brightness / Contrast / Saturation (sliders)
   - Annotations: Pen, Text, Arrow, Highlight
4. Undo/Redo buttons revert/restore steps
5. Tap "Save" → new edited version is produced, original untouched
6. Message bubble shows "Edited" label

## Architecture

```
ImageEditor (modal)
├── ToolBar              — crop, adjust, annotate, text mode toggles
├── Canvas / ImageView   — renders the image + overlay annotations
├── CropTool             — crop rectangle + rotation slider
├── AdjustPanel          — brightness, contrast, saturation sliders
├── AnnotationToolbar    — pen, text, arrow, highlight buttons
├── UndoRedoBar          — undo / redo action buttons
└── Footer               — cancel / save buttons
```

## State

- **MobX store** (`editorStore.ts`) holds the entire edit session:
  - `history: ImageState[]` — undo stack
  - `future: ImageState[]` — redo stack
  - `currentOperation: EditOperation` — active tool
  - `cropRect`, `rotation` — crop/rotate state
  - `brightness`, `contrast`, `saturation` — adjustment values
  - `annotations: Annotation[]` — list of drawn annotations
  - `selectedAnnotationId: string | null`
  - `penColor`, `penWidth` — drawing config

## ImageState

Every time the user performs an action, the current `ImageState` is pushed onto `history`. Undo pops the stack and pushes the current state onto `future`. Redo does the reverse.

## Types

See `types.ts` for `EditOperation`, `Annotation`, and `ImageState` definitions.

## Annotations

| Type      | Storage                                        |
| --------- | ---------------------------------------------- |
| Pen       | Array of `{x, y}` points + color + width       |
| Text      | Position `{x, y}`, string, font size, color    |
| Arrow     | `{from, to}` points, color, lineWidth          |
| Highlight | `{x, y, width, height}`, color, opacity        |

## Export

Final image is produced by composing the original image with current crop/rotate/adjust/annotation layers into a single bitmap via `react-native-view-shot` or a canvas. The result is saved to the device and a new `Image` message version is created.
