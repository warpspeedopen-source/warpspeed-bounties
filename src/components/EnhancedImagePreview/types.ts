export interface ImageSource {
  uri: string;
  id: string;
  type: string;
}

export interface ImagePreviewProps {
  images: ImageSource[];
  initialIndex: number;
  visible: boolean;
  onRequestClose: () => void;
  onImageIndexChange: (index: number) => void;
}

export interface ImagePreviewState {
  images: ImageSource[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

export const ImagePreview: React.FC<{}> = ({ 
  images, 
  initialIndex,
  visible, 
  onRequestClose,
  onImageIndexChange 
}) => {
  return;
};