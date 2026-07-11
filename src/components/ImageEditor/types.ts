export interface EditAction {
  id: string;
  type: 'crop' | 'rotate' | 'brightness' | 'contrast' | 'annotation' | ' saturation';
  timestamp: number;
  data: any;
}

export interface ImageEditorState {
  imageUri: string;
  edits: EditAction[];
  currentIndex: number;
}

export interface CropDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface Annotation {
  type: 'pen' | 'text' | 'arrow' | 'highlight';
  data: {
    points?: Array<{x: number, y: number}>;
    text?: string;
    position?: {x: number, y: number};
  };
}

export interface ImageEdit {
  id: string;
  action: 'crop' | 'rotate' | 'adjust' | 'annotate';
  timestamp: number;
  crop?: CropDimensions;
  adjustments?: ImageAdjustments;
  annotations?: Annotation[];
}

export interface ImageHistory {
  edits: ImageEdit[];
  currentIndex: number;
}

export interface EditorTool {
  name: string;
  icon: string;
  active: boolean;
}

export interface EditorConfig {
  tools: EditorTool[];
  defaultTool?: string;
}