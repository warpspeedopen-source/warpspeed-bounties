/**
 * useImageEditor - Main Editor Hook
 * 
 * Central hook that manages the full editor state including
 * adjustments, annotations, rotation, crop, and undo/redo history.
 */

import { useCallback, useRef, useState, useMemo } from 'react';
import {
  ImageEditorState,
  EditorTool,
  ImageAdjustments,
  Annotation,
  RotationAngle,
  CropRegion,
  CropAspectRatio,
  EditResult,
  Dimensions,
  DEFAULT_ADJUSTMENTS,
} from '../types';
import { HistoryManager, createSnapshot, createInitialSnapshot } from '../utils/historyManager';
import {
  clampAdjustments,
  addRotation,
  buildEditResult,
  cropRegionsEqual,
  constrainCropAspectRatio,
} from '../utils/imageProcessing';

interface UseImageEditorOptions {
  sourceUri: string;
  canvasSize: Dimensions;
}

interface UseImageEditorReturn {
  state: ImageEditorState;
  setActiveTool: (tool: EditorTool | null) => void;
  setAdjustments: (adjustments: Partial<ImageAdjustments>) => void;
  setRotation: (rotation: RotationAngle) => void;
  rotateClockwise: () => void;
  rotateCounterClockwise: () => void;
  setCropRegion: (region: CropRegion | null) => void;
  setCropAspectRatio: (ratio: CropAspectRatio) => void;
  applyCrop: () => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  save: () => EditResult;
  setImageSize: (size: Dimensions) => void;
}

export function useImageEditor({
  sourceUri,
  canvasSize,
}: UseImageEditorOptions): UseImageEditorReturn {
  const historyRef = useRef(new HistoryManager());

  const [state, setState] = useState<ImageEditorState>(() => {
    const initialSnapshot = createInitialSnapshot();
    historyRef.current.push(initialSnapshot, 'Initial state');

    return {
      originalUri: sourceUri,
      currentUri: sourceUri,
      activeTool: null,
      cropRegion: null,
      rotation: 0,
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      annotations: [],
      undoStack: [],
      redoStack: [],
      isDirty: false,
      canvasSize,
      imageSize: null,
    };
  });

  // Track dirty state
  const markDirty = useCallback(() => {
    setState((prev) => ({ ...prev, isDirty: true }));
  }, []);

  // Push current state to history
  const pushHistory = useCallback(
    (description: string) => {
      setState((prev) => {
        const snapshot = createSnapshot(
          prev.adjustments,
          prev.annotations,
          prev.rotation,
          prev.cropRegion
        );
        historyRef.current.push(snapshot, description);
        return prev;
      });
    },
    []
  );

  // Restore state from a snapshot
  const restoreSnapshot = useCallback(
    (snapshot: ReturnType<typeof createInitialSnapshot>) => {
      setState((prev) => ({
        ...prev,
        adjustments: { ...snapshot.adjustments },
        annotations: [...snapshot.annotations],
        rotation: snapshot.rotation,
        cropRegion: snapshot.cropRegion ? { ...snapshot.cropRegion } : null,
      }));
    },
    []
  );

  // ─── Tool Selection ────────────────────────────────────────

  const setActiveTool = useCallback((tool: EditorTool | null) => {
    setState((prev) => ({ ...prev, activeTool: tool }));
  }, []);

  // ─── Adjustments ───────────────────────────────────────────

  const setAdjustments = useCallback(
    (partial: Partial<ImageAdjustments>) => {
      setState((prev) => {
        const newAdjustments = clampAdjustments({
          ...prev.adjustments,
          ...partial,
        });
        return { ...prev, adjustments: newAdjustments };
      });
      markDirty();
      pushHistory('Adjust image');
    },
    [markDirty, pushHistory]
  );

  // ─── Rotation ──────────────────────────────────────────────

  const setRotation = useCallback(
    (rotation: RotationAngle) => {
      setState((prev) => ({ ...prev, rotation }));
      markDirty();
      pushHistory('Set rotation');
    },
    [markDirty, pushHistory]
  );

  const rotateClockwise = useCallback(() => {
    setState((prev) => ({
      ...prev,
      rotation: addRotation(prev.rotation, 90),
    }));
    markDirty();
    pushHistory('Rotate clockwise');
  }, [markDirty, pushHistory]);

  const rotateCounterClockwise = useCallback(() => {
    setState((prev) => ({
      ...prev,
      rotation: addRotation(prev.rotation, -90),
    }));
    markDirty();
    pushHistory('Rotate counter-clockwise');
  }, [markDirty, pushHistory]);

  // ─── Crop ──────────────────────────────────────────────────

  const setCropRegion = useCallback(
    (region: CropRegion | null) => {
      setState((prev) => ({ ...prev, cropRegion: region }));
    },
    []
  );

  const setCropAspectRatio = useCallback(
    (ratio: CropAspectRatio) => {
      setState((prev) => {
        if (!prev.cropRegion) return prev;
        const constrained = constrainCropAspectRatio(prev.cropRegion, ratio);
        return {
          ...prev,
          cropRegion: { ...constrained, aspectRatio: ratio },
        };
      });
    },
    []
  );

  const applyCrop = useCallback(() => {
    setState((prev) => {
      if (!prev.cropRegion) return prev;
      markDirty();
      pushHistory('Apply crop');
      // In production, this would trigger actual image cropping
      // and update currentUri
      return {
        ...prev,
        cropRegion: null,
        activeTool: null,
      };
    });
  }, [markDirty, pushHistory]);

  // ─── Annotations ───────────────────────────────────────────

  const addAnnotation = useCallback(
    (annotation: Annotation) => {
      setState((prev) => ({
        ...prev,
        annotations: [...prev.annotations, annotation],
      }));
      markDirty();
      pushHistory(`Add ${annotation.type} annotation`);
    },
    [markDirty, pushHistory]
  );

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<Annotation>) => {
      setState((prev) => ({
        ...prev,
        annotations: prev.annotations.map((ann) =>
          ann.id === id ? ({ ...ann, ...updates } as Annotation) : ann
        ),
      }));
      markDirty();
    },
    [markDirty]
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        annotations: prev.annotations.filter((ann) => ann.id !== id),
      }));
      markDirty();
      pushHistory('Delete annotation');
    },
    [markDirty, pushHistory]
  );

  // ─── Undo / Redo ──────────────────────────────────────────

  const undo = useCallback(() => {
    const snapshot = historyRef.current.undo();
    if (snapshot) {
      restoreSnapshot(snapshot);
    }
  }, [restoreSnapshot]);

  const redo = useCallback(() => {
    const snapshot = historyRef.current.redo();
    if (snapshot) {
      restoreSnapshot(snapshot);
    }
  }, [restoreSnapshot]);

  const canUndo = historyRef.current.canUndo;
  const canRedo = historyRef.current.canRedo;

  // ─── Reset ─────────────────────────────────────────────────

  const reset = useCallback(() => {
    const initialSnapshot = createInitialSnapshot();
    historyRef.current.clear();
    historyRef.current.push(initialSnapshot, 'Reset');
    restoreSnapshot(initialSnapshot);
    setState((prev) => ({
      ...prev,
      isDirty: false,
      rotation: 0,
      activeTool: null,
      cropRegion: null,
    }));
  }, [restoreSnapshot]);

  // ─── Save ──────────────────────────────────────────────────

  const save = useCallback((): EditResult => {
    return buildEditResult(state.currentUri, state.originalUri, {
      adjustments: state.adjustments,
      rotation: state.rotation,
      annotations: state.annotations,
      isDirty: state.isDirty,
    });
  }, [state]);

  // ─── Image Size ────────────────────────────────────────────

  const setImageSize = useCallback((size: Dimensions) => {
    setState((prev) => ({ ...prev, imageSize: size }));
  }, []);

  return {
    state,
    setActiveTool,
    setAdjustments,
    setRotation,
    rotateClockwise,
    rotateCounterClockwise,
    setCropRegion,
    setCropAspectRatio,
    applyCrop,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    save,
    setImageSize,
  };
}
