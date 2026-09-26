# Enhanced Image Preview — Implementation

## Summary
Adds an enhanced image preview component with zoom, pan, and metadata overlay to the mail client UI.

## Implementation

### `src/components/EnhancedImagePreview.tsx`
```tsx
import React, { useState, useCallback, useRef } from 'react';

interface EnhancedImagePreviewProps {
  src: string;
  alt?: string;
  filename?: string;
  sizeBytes?: number;
}

export const EnhancedImagePreview: React.FC<EnhancedImagePreviewProps> = ({
  src,
  alt = '',
  filename,
  sizeBytes,
}) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const next = Math.min(5, Math.max(0.5, scale - e.deltaY * 0.001));
    setScale(next);
  }, [scale]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setOffset((o) => ({
      x: o.x + (e.clientX - last.current.x),
      y: o.y + (e.clientY - last.current.y),
    }));
    last.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = () => { dragging.current = false; };

  const reset = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  return (
    <div className="enhanced-image-preview" role="figure" aria-label={alt}>
      <div
        className="preview-viewport"
        style={{ overflow: 'hidden', cursor: dragging.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={reset}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragging.current ? 'none' : 'transform 0.1s ease-out',
            maxWidth: '100%',
          }}
        />
      </div>
      <div className="preview-toolbar">
        <button onClick={() => setScale((s) => Math.min(5, s * 1.25))} aria-label="Zoom in">+</button>
        <button onClick={() => setScale((s) => Math.max(0.5, s / 1.25))} aria-label="Zoom out">−</button>
        <button onClick={reset} aria-label="Reset view">Reset</button>
        <span className="preview-meta">
          {filename}{sizeBytes ? ` · ${(sizeBytes / 1024).toFixed(1)} KB` : ''}
        </span>
      </div>
    </div>
  );
};
```

## Behavior
- **Zoom:** mouse wheel or +/− buttons, clamped to [0.5×, 5×].
- **Pan:** drag with pointer events (mouse + touch via `touchAction: none`).
- **Reset:** double-click viewport or Reset button.
- **Metadata overlay:** filename + human-readable size in the toolbar.
- **Accessibility:** `role="figure"`, `aria-label`, keyboard-focusable buttons.

## Tests
`src/components/__tests__/EnhancedImagePreview.test.tsx` verifies zoom clamping, pan offset accumulation, and reset behavior via React Testing Library.

## Risk
Purely additive UI component; no changes to existing mail rendering paths.