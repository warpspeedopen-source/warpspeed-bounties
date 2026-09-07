export interface ImageState {
  uri: string;
  rotation: number;
  crop: { x: number; y: number; width: number; height: number } | null;
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  annotations: Annotation[];
}

export type AnnotationType = 'pen' | 'text' | 'arrow' | 'highlight';

export interface Annotation {
  id: string;
  type: AnnotationType;
  color: string;
  points?: { x: number; y: number }[]; // For pen and highlight
  text?: string; // For text
  startPoint?: { x: number; y: number }; // For arrow
  endPoint?: { x: number; y: number }; // For arrow
}

export interface HistoryState {
  past: ImageState[];
  present: ImageState;
  future: ImageState[];
}
