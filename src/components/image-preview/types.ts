import { ImageURISource, Image } from 'react-native';

export interface ImagePreview {
  uri: string;
  width: number;
  height: number;
  source: ImageURISource;
}

export interface ImagePreviewProps {
  images: ImagePreview[];
  initialIndex: number;
  onImageChange?: (index: number) => void;
  onImageChange(index);
}