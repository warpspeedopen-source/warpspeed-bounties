/**
 * Enhanced Image Preview - Shared Types & Interfaces
 * Bounty: Enhanced Image Preview (#6)
 */

export interface ImagePreviewItem {
  id: string;
  uri: string;
  thumbnailUri?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  filename?: string;
  /** Optional metadata displayed in info panel */
  metadata?: Record<string, string>;
}

export interface ImagePreviewAction {
  key: 'download' | 'share' | 'delete' | 'info';
  label: string;
  icon: string;
  /** Whether the action is currently available based on permissions */
  available: boolean;
  /** Handler called when the action is triggered */
  onPress: (image: ImagePreviewItem) => void;
  /** Confirmation prompt shown before destructive actions */
  confirmMessage?: string;
}

export interface GestureConfig {
  /** Minimum scale for pinch-to-zoom (default: 0.5) */
  minScale?: number;
  /** Maximum scale for pinch-to-zoom (default: 5.0) */
  maxScale?: number;
  /** Enable double-tap to zoom (default: true) */
  enableDoubleTapZoom?: boolean;
  /** Double-tap zoom level (default: 2.5) */
  doubleTapZoomLevel?: number;
  /** Enable swipe to dismiss when at minimum scale (default: true) */
  enableSwipeDismiss?: boolean;
}

export interface ImagePreviewConfig {
  /** Gesture behavior configuration */
  gestures?: GestureConfig;
  /** Show top bar with actions (default: true) */
  showActionBar?: boolean;
  /** Show bottom thumbnail strip (default: true when multiple images) */
  showThumbnailStrip?: boolean;
  /** Show page indicator dots (default: true when multiple images) */
  showPageIndicator?: boolean;
  /** Show image counter "3 / 12" (default: true when multiple images) */
  showImageCounter?: boolean;
  /** Background color when preview is open (default: '#000000') */
  backgroundColor?: string;
  /** Custom actions available in the preview */
  actions?: ImagePreviewAction[];
  /** Callback when preview is closed */
  onClose?: () => void;
  /** Callback when image changes via swipe */
  onImageChange?: (index: number, image: ImagePreviewItem) => void;
  /** Starting image index (default: 0) */
  initialIndex?: number;
}

export interface ImageViewerState {
  currentIndex: number;
  scale: number;
  translateX: number;
  translateY: number;
  isOverlayVisible: boolean;
  isInfoPanelVisible: boolean;
  containerWidth: number;
  containerHeight: number;
}
