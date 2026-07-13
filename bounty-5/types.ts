export type EditOperation =
  | 'none'
  | 'crop'
  | 'adjust'
  | 'pen'
  | 'text'
  | 'arrow'
  | 'highlight';

export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  type: 'pen' | 'text' | 'arrow' | 'highlight';
  color: string;
  opacity?: number;

  // Pen
  points?: Point[];
  lineWidth?: number;

  // Text
  position?: Point;
  content?: string;
  fontSize?: number;

  // Arrow
  from?: Point;
  to?: Point;

  // Highlight
  rect?: { x: number; y: number; width: number; height: number };
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageState {
  uri: string;
  width: number;
  height: number;
  cropRect: CropRect | null;
  rotation: number;
  brightness: number;
  contrast: number;
  saturation: number;
  annotations: Annotation[];
}

export interface EditorStoreData {
  visible: boolean;
  history: ImageState[];
  future: ImageState[];
  currentOperation: EditOperation;
  cropRect: CropRect | null;
  rotation: number;
  brightness: number;
  contrast: number;
  saturation: number;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  penColor: string;
  penWidth: number;
  fontSize: number;
  textColor: string;
  arrowColor: string;
  highlightColor: string;
  highlightOpacity: number;
}
