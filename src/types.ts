export interface ImageItem {
  id: string;
  uri: string;
}

export interface EnhancedImagePreviewProps {
  images: ImageItem[];
  initialIndex?: number;
  visible: boolean;
  onRequestClose: () => void;
  onDownload?: (image: ImageItem) => void;
  onShare?: (image: ImageItem) => void;
  onDelete?: (image: ImageItem) => void;
}
