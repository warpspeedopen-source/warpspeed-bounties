export interface ImageItem {
  id: string;
  url: string;
  width?: number;
  height?: number;
  title?: string;
}

export interface EnhancedImagePreviewProps {
  images: ImageItem[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
  onDownload?: (image: ImageItem) => void;
  onShare?: (image: ImageItem) => void;
  onDelete?: (image: ImageItem) => void;
}
