import { useState, useCallback, useRef } from 'react';
import type { EditorSnapshot, CropRegion, ImageAdjustments, Annotation } from '../types';

/**
 * Hook that manages undo/redo history for image editing operations.
 * Each editor action pushes a snapshot onto the undo stack.
 */
export function useEditHistory(initialSnapshot?: Partial<EditorSnapshot>) {
  const [undoStack, setUndoStack] = useState<EditorSnapshot[]>(() => {
    const base: EditorSnapshot = {
      cropRegion: null,
      rotation: 0,
      adjustments: { brightness: 0, contrast: 0 },
      annotations: [],
    };
    if (initialSnapshot) {
      Object.assign(base, initialSnapshot);
    }
    return [base];
  });

  const [redoStack, setRedoStack] = useState<EditorSnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < undoStack.length - 1;

  const pushSnapshot = useCallback(
    (snapshot: EditorSnapshot) => {
      setUndoStack((prev) => {
        const trimmed = prev.slice(0, currentIndex + 1);
        return [...trimmed, snapshot];
      });
      setRedoStack([]);
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex]
  );

  const undo = useCallback(() => {
    if (!canUndo) return null;
    setRedoStack((prev) => [...prev, undoStack[currentIndex]]);
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return undoStack[newIndex];
  }, [canUndo, currentIndex, undoStack]);

  const redo = useCallback(() => {
    if (!canRedo) return null;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    setRedoStack((prev) => prev.slice(0, -1));
    return undoStack[newIndex];
  }, [canRedo, currentIndex, undoStack]);

  const currentSnapshot: EditorSnapshot = undoStack[currentIndex];

  return {
    currentSnapshot,
    canUndo,
    canRedo,
    pushSnapshot,
    undo,
    redo,
  };
}
