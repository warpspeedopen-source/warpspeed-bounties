/**
 * History Manager - Undo/Redo
 * 
 * Manages editor state history for undo/redo functionality.
 * Uses snapshot-based history with configurable max depth.
 */

import {
  HistoryEntry,
  EditorSnapshot,
  ImageAdjustments,
  Annotation,
  RotationAngle,
  CropRegion,
} from '../types';

const MAX_HISTORY_SIZE = 50;
const HISTORY_DEBOUNCE_MS = 300;

export class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private lastPushTimestamp = 0;
  private entryCounter = 0;

  /**
   * Push a new snapshot onto the history stack
   */
  push(snapshot: EditorSnapshot, description: string): void {
    const now = Date.now();

    // Debounce rapid pushes (e.g., dragging a slider)
    if (now - this.lastPushTimestamp < HISTORY_DEBOUNCE_MS) {
      // Replace the top entry instead of adding a new one
      if (this.undoStack.length > 0) {
        this.undoStack[this.undoStack.length - 1] = this.createEntry(
          snapshot,
          description
        );
        this.lastPushTimestamp = now;
        return;
      }
    }

    this.undoStack.push(this.createEntry(snapshot, description));
    this.lastPushTimestamp = now;

    // Clear redo stack on new action
    this.redoStack = [];

    // Trim to max size
    if (this.undoStack.length > MAX_HISTORY_SIZE) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo the last action, returning the previous snapshot
   */
  undo(): EditorSnapshot | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;

    this.redoStack.push(entry);

    // Return the new top of the undo stack, or null if empty
    if (this.undoStack.length > 0) {
      return this.undoStack[this.undoStack.length - 1].snapshot;
    }

    return null;
  }

  /**
   * Redo the last undone action
   */
  redo(): EditorSnapshot | null {
    const entry = this.redoStack.pop();
    if (!entry) return null;

    this.undoStack.push(entry);
    return entry.snapshot;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.entryCounter = 0;
    this.lastPushTimestamp = 0;
  }

  /**
   * Whether undo is available
   */
  get canUndo(): boolean {
    return this.undoStack.length > 1; // Need at least 2 entries (current + previous)
  }

  /**
   * Whether redo is available
   */
  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get current snapshot (top of undo stack)
   */
  get currentSnapshot(): EditorSnapshot | null {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1].snapshot;
  }

  /**
   * Get history for display/debugging
   */
  getHistory(): Array<{ description: string; timestamp: number }> {
    return this.undoStack.map((entry) => ({
      description: entry.description,
      timestamp: entry.timestamp,
    }));
  }

  private createEntry(snapshot: EditorSnapshot, description: string): HistoryEntry {
    this.entryCounter++;
    return {
      id: `history_${this.entryCounter}_${Date.now()}`,
      timestamp: Date.now(),
      description,
      snapshot: this.deepClone(snapshot),
    };
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}

// ─── Snapshot creation helpers ─────────────────────────────────

/**
 * Create a snapshot from current editor state
 */
export function createSnapshot(
  adjustments: ImageAdjustments,
  annotations: Annotation[],
  rotation: RotationAngle,
  cropRegion: CropRegion | null
): EditorSnapshot {
  return {
    adjustments: { ...adjustments },
    annotations: annotations.map((a) => ({ ...a })),
    rotation,
    cropRegion: cropRegion ? { ...cropRegion } : null,
  };
}

/**
 * Create the initial snapshot (neutral state)
 */
export function createInitialSnapshot(): EditorSnapshot {
  return {
    adjustments: { brightness: 0, contrast: 0, saturation: 0 },
    annotations: [],
    rotation: 0,
    cropRegion: null,
  };
}
