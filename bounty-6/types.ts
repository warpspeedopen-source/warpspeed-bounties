export interface GalleryItem {
  id: string
  uri: string
  thumbnailUri?: string
  type?: 'image' | 'video'
  filename?: string
  metadata?: Record<string, unknown>
}

export interface PreviewState {
  isVisible: boolean
  currentIndex: number
  items: GalleryItem[]
  initialIndex: number
}

export interface ZoomLevel {
  scale: number
  translateX: number
  translateY: number
}

export type ZoomChangeCallback = (isZoomed: boolean) => void
export type ActionHandler = (item: GalleryItem, index: number) => void
