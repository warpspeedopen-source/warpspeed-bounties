import { makeAutoObservable } from 'mobx'
import { GalleryItem } from '../types'

class PreviewStore {
  isVisible = false
  currentIndex = 0
  items: GalleryItem[] = []

  constructor() {
    makeAutoObservable(this)
  }

  open(items: GalleryItem[], index = 0) {
    this.items = items
    this.currentIndex = Math.min(index, items.length - 1)
    this.isVisible = true
  }

  close() {
    this.isVisible = false
  }

  get currentItem(): GalleryItem | null {
    return this.items[this.currentIndex] ?? null
  }

  get hasNext(): boolean {
    return this.currentIndex < this.items.length - 1
  }

  get hasPrev(): boolean {
    return this.currentIndex > 0
  }

  get totalCount(): number {
    return this.items.length
  }

  next() {
    if (this.hasNext) {
      this.currentIndex += 1
    }
  }

  prev() {
    if (this.hasPrev) {
      this.currentIndex -= 1
    }
  }

  goTo(index: number) {
    if (index >= 0 && index < this.items.length) {
      this.currentIndex = index
    }
  }

  removeCurrent() {
    if (this.items.length === 0) return
    this.items = this.items.filter((_, i) => i !== this.currentIndex)
    if (this.items.length === 0) {
      this.close()
    } else if (this.currentIndex >= this.items.length) {
      this.currentIndex = this.items.length - 1
    }
  }
}

export default PreviewStore
