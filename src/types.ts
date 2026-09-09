/**
 * Image Preview Component Type Definitions
 */

export interface ImageItem {
  /** Unique identifier for the image */
  id: string;
  /** Image source URI */
  uri: string;
  /** Optional image width */
  width?: number;
  /** Optional image height */
  height?: number;
  /** Optional alt text for accessibility */
  alt?: string;
}

export interface EnhancedImagePreviewProps {
  /** Array of images to display */
  images: ImageItem[];
  /** Initial index to show when preview opens */
  initialIndex?: number;
  /** Whether the preview modal is visible */
  visible: boolean;
  /** Callback fired when user requests to close the preview */
  onRequestClose: () => void;
  /** Optional callback for download action */
  onDownload?: (image: ImageItem, index: number) => void;
  /** Optional callback for share action */
  onShare?: (image: ImageItem, index: number) => void;
  /** Optional callback for delete action */
  onDelete?: (image: ImageItem, index: number) => void;
  /** Whether download is enabled */
  enableDownload?: boolean;
  /** Whether share is enabled */
  enableShare?: boolean;
  /** Whether delete is enabled */
  enableDelete?: boolean;
  /** Background color of the preview overlay */
  backgroundColor?: string;
  /** Minimum scale factor for pinch/zoom */
  minScale?: number;
  /** Maximum scale factor for pinch/zoom */
  maxScale?: number;
  /** Scale factor for double-tap gesture */
  doubleTapScale?: number;
}
