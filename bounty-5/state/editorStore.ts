import { makeAutoObservable } from 'mobx';
import {
  EditOperation,
  ImageState,
  Annotation,
  CropRect,
} from '../types';

class EditorStore {
  visible = false;
  history: ImageState[] = [];
  future: ImageState[] = [];
  currentOperation: EditOperation = 'none';

  cropRect: CropRect | null = null;
  rotation = 0;
  brightness = 1;
  contrast = 1;
  saturation = 1;
  annotations: Annotation[] = [];
  selectedAnnotationId: string | null = null;

  penColor = '#ffffff';
  penWidth = 4;
  fontSize = 16;
  textColor = '#ffffff';
  arrowColor = '#ffffff';
  highlightColor = '#ffff00';
  highlightOpacity = 0.3;

  private _originalState: ImageState | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get currentState(): ImageState | null {
    return this._originalState
      ? {
          ...this._originalState,
          cropRect: this.cropRect,
          rotation: this.rotation,
          brightness: this.brightness,
          contrast: this.contrast,
          saturation: this.saturation,
          annotations: [...this.annotations],
        }
      : null;
  }

  openEditor(initialState: ImageState) {
    this._originalState = { ...initialState };
    this.cropRect = initialState.cropRect;
    this.rotation = initialState.rotation;
    this.brightness = initialState.brightness;
    this.contrast = initialState.contrast;
    this.saturation = initialState.saturation;
    this.annotations = [...initialState.annotations];
    this.history = [];
    this.future = [];
    this.currentOperation = 'none';
    this.visible = true;
  }

  closeEditor() {
    this.visible = false;
    this._originalState = null;
  }

  saveEdit() {
    // In production, compose the edited image to a file, update the message,
    // mark it as "Edited", and close.
    this.closeEditor();
  }

  // ── Undo / Redo ──────────────────────────────────────

  private pushHistory() {
    const state = this.currentState;
    if (state) {
      this.history.push(state);
      this.future = [];
    }
  }

  undo() {
    const prev = this.history.pop();
    if (!prev) return;
    const current = this.currentState;
    if (current) this.future.push(current);
    this.applyState(prev);
  }

  redo() {
    const next = this.future.pop();
    if (!next) return;
    const current = this.currentState;
    if (current) this.history.push(current);
    this.applyState(next);
  }

  private applyState(state: ImageState) {
    this.cropRect = state.cropRect;
    this.rotation = state.rotation;
    this.brightness = state.brightness;
    this.contrast = state.contrast;
    this.saturation = state.saturation;
    this.annotations = [...state.annotations];
  }

  // ── Setters (auto-push history) ──────────────────────

  setCurrentOperation(op: EditOperation) {
    this.currentOperation = op;
  }

  setRotation(val: number) {
    this.pushHistory();
    this.rotation = val;
  }

  setBrightness(val: number) {
    this.pushHistory();
    this.brightness = val;
  }

  setContrast(val: number) {
    this.pushHistory();
    this.contrast = val;
  }

  setSaturation(val: number) {
    this.pushHistory();
    this.saturation = val;
  }

  setCropRect(rect: CropRect | null) {
    this.pushHistory();
    this.cropRect = rect;
  }

  addAnnotation(annotation: Annotation) {
    this.pushHistory();
    this.annotations.push(annotation);
  }

  updateAnnotation(id: string, updates: Partial<Annotation>) {
    this.pushHistory();
    const idx = this.annotations.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.annotations[idx] = { ...this.annotations[idx], ...updates };
    }
  }

  removeAnnotation(id: string) {
    this.pushHistory();
    this.annotations = this.annotations.filter((a) => a.id !== id);
  }

  setSelectedAnnotationId(id: string | null) {
    this.selectedAnnotationId = id;
  }

  setActiveColor(color: string) {
    switch (this.currentOperation) {
      case 'pen':
        this.penColor = color;
        break;
      case 'text':
        this.textColor = color;
        break;
      case 'arrow':
        this.arrowColor = color;
        break;
      case 'highlight':
        this.highlightColor = color;
        break;
    }
  }

  setPenWidth(width: number) {
    this.penWidth = width;
  }

  setFontSize(size: number) {
    this.fontSize = size;
  }

  setHighlightOpacity(opacity: number) {
    this.highlightOpacity = opacity;
  }
}

// Singleton export via React context
let storeInstance: EditorStore | null = null;

export function getEditorStore(): EditorStore {
  if (!storeInstance) {
    storeInstance = new EditorStore();
  }
  return storeInstance;
}

export function useEditorStore(): EditorStore {
  return getEditorStore();
}

export default EditorStore;
