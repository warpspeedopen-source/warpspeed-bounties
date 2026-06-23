/**
 * Inline Image Editor - Type Definitions
 * 
 * Core types for the warpSpeed inline image editing feature.
 * Supports crop, rotate, adjustments, and annotations.
 */

// ─── Editor State ──────────────────────────────────────────────

export interface ImageEditorState {
  /** Original image URI (never modified) */
  originalUri: string;
  /** Current working image URI */
  currentUri: string;
  /** Active editing tool */
  activeTool: EditorTool | null;
  /** Crop region */
  cropRegion: CropRegion | null;
  /** Rotation angle in degrees (0, 90, 180, 270) */
  rotation: RotationAngle;
  /** Image adjustments */
  adjustments: ImageAdjustments;
  /** List of annotations on the image */
  annotations: Annotation[];
  /** History stack for undo */
  undoStack: HistoryEntry[];
  /** Redo stack */
  redoStack: HistoryEntry[];
  /** Whether the image has been modified */
  isDirty: boolean;
  /** Editor dimensions */
  canvasSize: Dimensions;
  /** Original image dimensions */
  imageSize: Dimensions | null;
}

export type EditorTool =
  | 'crop'
  | 'rotate'
  | 'adjust'
  | 'pen'
  | 'text'
  | 'arrow'
  | 'highlight';

export type RotationAngle = 0 | 90 | 180 | 270;

export interface Dimensions {
  width: number;
  height: number;
}

// ─── Crop ──────────────────────────────────────────────────────

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Aspect ratio lock (e.g., 'free', '1:1', '4:3', '16:9') */
  aspectRatio: CropAspectRatio;
}

export type CropAspectRatio = 'free' | '1:1' | '4:3' | '16:9' | '3:2';

export interface CropPreset {
  label: string;
  value: CropAspectRatio;
  icon?: string;
}

// ─── Adjustments ───────────────────────────────────────────────

export interface ImageAdjustments {
  /** Brightness: -100 to 100 (0 = neutral) */
  brightness: number;
  /** Contrast: -100 to 100 (0 = neutral) */
  contrast: number;
  /** Saturation: -100 to 100 (0 = neutral) */
  saturation: number;
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
};

export interface AdjustmentSliderConfig {
  key: keyof ImageAdjustments;
  label: string;
  icon: string;
  min: number;
  max: number;
  step: number;
}

// ─── Annotations ───────────────────────────────────────────────

export type Annotation = PenAnnotation | TextAnnotation | ArrowAnnotation | HighlightAnnotation;

export type AnnotationType = 'pen' | 'text' | 'arrow' | 'highlight';

interface AnnotationBase {
  id: string;
  type: AnnotationType;
  color: string;
  opacity: number;
  /** Creation timestamp */
  timestamp: number;
}

export interface PenAnnotation extends AnnotationBase {
  type: 'pen';
  /** Array of points forming the pen stroke */
  points: Point[];
  strokeWidth: number;
}

export interface TextAnnotation extends AnnotationBase {
  type: 'text';
  text: string;
  position: Point;
  fontSize: number;
  fontFamily: string;
  /** Background color behind text (optional) */
  backgroundColor?: string;
}

export interface ArrowAnnotation extends AnnotationBase {
  type: 'arrow';
  startPoint: Point;
  endPoint: Point;
  strokeWidth: number;
}

export interface HighlightAnnotation extends AnnotationBase {
  type: 'highlight';
  /** Rectangle region to highlight */
  region: Rect;
  /** Highlight fill color (semi-transparent) */
  fillColor: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── History / Undo-Redo ───────────────────────────────────────

export interface HistoryEntry {
  id: string;
  timestamp: number;
  description: string;
  snapshot: EditorSnapshot;
}

export interface EditorSnapshot {
  adjustments: ImageAdjustments;
  annotations: Annotation[];
  rotation: RotationAngle;
  cropRegion: CropRegion | null;
}

// ─── Integration Types ─────────────────────────────────────────

export type EditorContext = 'notes' | 'messenger';

export interface EditResult {
  /** URI of the edited image (new file, original preserved) */
  editedUri: string;
  /** Whether the image was actually modified */
  wasModified: boolean;
  /** Edit metadata */
  metadata: EditMetadata;
}

export interface EditMetadata {
  editedAt: string;
  originalUri: string;
  appliedTools: EditorTool[];
  adjustments: ImageAdjustments;
  rotation: RotationAngle;
  hadAnnotations: boolean;
}

export interface MessengerEditOptions {
  /** Original message timestamp */
  originalSentAt: string;
  /** Whether the 15-minute edit window applies */
  applyEditWindow: boolean;
  /** Edit window duration in ms (default: 15 minutes) */
  editWindowMs?: number;
}

export interface MessengerEditResult extends EditResult {
  /** Whether "(Edited)" label should be shown */
  showEditedLabel: boolean;
}

// ─── Component Props ───────────────────────────────────────────

export interface ImageEditorProps {
  /** Source image URI */
  sourceUri: string;
  /** Context: 'notes' or 'messenger' */
  context: EditorContext;
  /** Called when user saves the edit */
  onSave: (result: EditResult) => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Messenger-specific options */
  messengerOptions?: MessengerEditOptions;
}

export interface EditorToolbarProps {
  activeTool: EditorTool | null;
  onToolSelect: (tool: EditorTool | null) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSave: () => void;
  onCancel: () => void;
  isDirty: boolean;
}

export interface CropOverlayProps {
  cropRegion: CropRegion;
  imageSize: Dimensions;
  canvasSize: Dimensions;
  aspectRatio: CropAspectRatio;
  onCropChange: (region: CropRegion) => void;
  onAspectRatioChange: (ratio: CropAspectRatio) => void;
}

export interface AdjustmentPanelProps {
  adjustments: ImageAdjustments;
  onChange: (adjustments: ImageAdjustments) => void;
}

export interface AnnotationToolbarProps {
  activeType: AnnotationType | null;
  onTypeSelect: (type: AnnotationType | null) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

export interface AnnotationCanvasProps {
  annotations: Annotation[];
  activeType: AnnotationType | null;
  activeColor: string;
  strokeWidth: number;
  fontSize: number;
  canvasSize: Dimensions;
  onAnnotationAdd: (annotation: Annotation) => void;
  onAnnotationUpdate: (id: string, annotation: Partial<Annotation>) => void;
  onAnnotationDelete: (id: string) => void;
}
