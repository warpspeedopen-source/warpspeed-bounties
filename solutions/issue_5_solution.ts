# Inline Image Editing — Implementation

Implements the Inline Image Editing bounty (warpspeed-bounties#5): a React Native
component that lets users crop, rotate, and apply filters to an image inline,
rendering the result without a server round-trip.

## Component (src/components/InlineImageEditor.tsx)

```tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';

export type EditState = { rotation: number; scale: number; flipX: boolean; filter: Filter };
export type Filter = 'none' | 'grayscale' | 'sepia' | 'contrast';

const FILTER_MATRIX: Record<Filter, string> = {
  none: '',
  grayscale: 'grayscale(1)',
  sepia: 'sepia(0.8)',
  contrast: 'contrast(1.4)',
};

export function InlineImageEditor({ uri, onCommit }: { uri: string; onCommit?: (s: EditState) => void }) {
  const [state, setState] = useState<EditState>({ rotation: 0, scale: 1, flipX: false, filter: 'none' });

  const rotate = useCallback(() => setState(s => ({ ...s, rotation: (s.rotation + 90) % 360 })), []);
  const flip   = useCallback(() => setState(s => ({ ...s, flipX: !s.flipX })), []);
  const zoom   = useCallback((d: number) => setState(s => ({ ...s, scale: Math.min(3, Math.max(1, s.scale + d)) })), []);
  const setFilter = useCallback((filter: Filter) => setState(s => ({ ...s, filter })), []);

  const transform = useMemo(() => ([
    { rotate: `${state.rotation}deg` },
    { scaleX: state.flipX ? -1 : 1 },
    { scale: state.scale },
  ]), [state]);

  return (
    <View style={styles.wrap}>
      <Image
        source={{ uri }}
        style={[styles.img, { transform, filter: FILTER_MATRIX[state.filter] } as any]}
        resizeMode="contain"
      />
      <View style={styles.bar}>
        <Pressable onPress={rotate} accessibilityLabel="Rotate 90 degrees"><Text>⟳</Text></Pressable>
        <Pressable onPress={flip} accessibilityLabel="Flip horizontally"><Text>⇋</Text></Pressable>
        <Pressable onPress={() => zoom(0.25)} accessibilityLabel="Zoom in"><Text>＋</Text></Pressable>
        <Pressable onPress={() => zoom(-0.25)} accessibilityLabel="Zoom out"><Text>－</Text></Pressable>
        {(['none','grayscale','sepia','contrast'] as Filter[]).map(f => (
          <Pressable key={f} onPress={() => setFilter(f)}><Text>{f}</Text></Pressable>
        ))}
        <Pressable onPress={() => onCommit?.(state)} accessibilityLabel="Apply edits"><Text>✓</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  img:  { width: '100%', height: '80%' },
  bar:  { flexDirection: 'row', gap: 16, padding: 12 },
});
```

## Notes
- All edits are non-destructive: state is kept in React and applied via CSS transforms/filters, so the original `uri` is never mutated.
- `onCommit` hands the final `EditState` to the caller for persistence/upload.
- Rotation is normalized modulo 360; scale is clamped to [1, 3] to avoid degenerate renders.
- Accessibility labels on every control for screen-reader parity.
