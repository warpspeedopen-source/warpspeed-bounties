export interface EditState {
  rotation: number;
  brightness: number;
  contrast: number;
  saturation: number;
  annotations: Annotation[];
}

export interface Annotation {
  id: string;
  type: 'pen' | 'text' | 'arrow' | 'highlight';
  x: number;
  y: number;
  text?: string;
  color: string;
}

export interface InlineImageEditorProps {
  originalImageUri: string;
  onSave: (newImageUri: string) => void;
  onCancel: () => void;
}
