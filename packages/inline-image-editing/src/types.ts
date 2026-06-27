// Types for Inline Image Editing

export type EditingMode = 'none' | 'crop' | 'rotate' | 'adjust' | 'annotate';

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageAdjustments {
  brightness: number; // -1 to 1, default 0
  contrast: number;   // -1 to 1, default 0
}

export interface Annotation {
  id: string;
  type: 'arrow' | 'text' | 'rect' | 'circle' | 'freehand';
  color: string;
  strokeWidth: number;
  // Arrow / freehand
  points?: Array<{ x: number; y: number }>;
  // Text
  text?: string;
  position?: { x: number; y: number };
  fontSize?: number;
  // Rect / Circle
  origin?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface ImageEditState {
  originalUri: string;
  currentUri: string;
  cropRegion: CropRegion | null;
  rotation: number; // degrees: 0, 90, 180, 270
  adjustments: ImageAdjustments;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  mode: EditingMode;
}

export interface EditorSnapshot {
  cropRegion: CropRegion | null;
  rotation: number;
  adjustments: ImageAdjustments;
  annotations: Annotation[];
}

export interface ImageEditorProps {
  imageUri: string;
  onSave: (uri: string) => void;
  onCancel: () => void;
  onSaveAs?: (uri: string) => void;
  maxZoom?: number;
  allowedModes?: EditingMode[];
}
