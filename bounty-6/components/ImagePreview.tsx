import React, { useCallback, useState } from 'react'
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native'
import { GalleryItem } from '../types'
import GallerySwiper from './GallerySwiper'
import ActionOverlay from './ActionOverlay'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface Props {
  visible: boolean
  items: GalleryItem[]
  initialIndex?: number
  onClose: () => void
  onDownload?: (item: GalleryItem) => void
  onShare?: (item: GalleryItem) => void
  onDelete?: (item: GalleryItem) => void
  renderLoader?: (item: GalleryItem) => React.ReactElement
}

const ImagePreview: React.FC<Props> = ({
  visible,
  items,
  initialIndex = 0,
  onClose,
  onDownload,
  onShare,
  onDelete,
  renderLoader,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [swipeLocked, setSwipeLocked] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(true)

  const fadeAnim = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }, [visible, fadeAnim])

  const handleClose = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose())
  }, [fadeAnim, onClose])

  const handleZoomChange = useCallback((isZoomed: boolean) => {
    setSwipeLocked(isZoomed)
  }, [])

  const handleSingleTap = useCallback(() => {
    setOverlayVisible((prev) => !prev)
  }, [])

  const handleDelete = useCallback(
    (item: GalleryItem) => {
      onDelete?.(item)
      // If the deleted item was the last one, close
      if (items.length <= 1) {
        handleClose()
      } else if (currentIndex >= items.length - 1) {
        setCurrentIndex(currentIndex - 1)
      }
    },
    [onDelete, items.length, currentIndex, handleClose],
  )

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

        <GallerySwiper
          items={items}
          initialIndex={initialIndex}
          swipeLocked={swipeLocked}
          onIndexChange={setCurrentIndex}
          onSingleTap={handleSingleTap}
          onZoomChange={handleZoomChange}
          renderLoader={renderLoader}
        />

        <ActionOverlay
          visible={overlayVisible}
          item={items[currentIndex]}
          currentIndex={currentIndex}
          totalCount={items.length}
          onClose={handleClose}
          onDownload={onDownload}
          onShare={onShare}
          onDelete={handleDelete}
        />
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
})

export default ImagePreview
