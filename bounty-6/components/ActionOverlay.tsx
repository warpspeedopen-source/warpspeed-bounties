import React, { useEffect, useRef } from 'react'
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
} from 'react-native'
import { GalleryItem } from '../types'

const SAFE_TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight ?? 24) + 12

interface Props {
  visible: boolean
  item: GalleryItem | null
  currentIndex: number
  totalCount: number
  onClose: () => void
  onDownload?: (item: GalleryItem) => void
  onShare?: (item: GalleryItem) => void
  onDelete?: (item: GalleryItem) => void
}

const ActionOverlay: React.FC<Props> = ({
  visible,
  item,
  currentIndex,
  totalCount,
  onClose,
  onDownload,
  onShare,
  onDelete,
}) => {
  const opacity = useRef(new Animated.Value(1)).current
  const prevVisible = useRef(visible)

  useEffect(() => {
    if (prevVisible.current !== visible) {
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
    prevVisible.current = visible
  }, [visible, opacity])

  if (!visible && !prevVisible.current) return null

  const handleDownload = () => item && onDownload?.(item)
  const handleShare = () => item && onShare?.(item)
  const handleDelete = () => item && onDelete?.(item)

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.counter}>
          {totalCount > 1 ? `${currentIndex + 1} / ${totalCount}` : ''}
        </Text>

        <View style={styles.placeholder} />
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        {!!onDownload && (
          <TouchableOpacity onPress={handleDownload} style={styles.actionButton}>
            <Text style={styles.actionIcon}>⬇</Text>
            <Text style={styles.actionLabel}>Save</Text>
          </TouchableOpacity>
        )}
        {!!onShare && (
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Text style={styles.actionIcon}>↗</Text>
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
        )}
        {!!onDelete && (
          <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
            <Text style={[styles.actionIcon, styles.deleteIcon]}>🗑</Text>
            <Text style={[styles.actionLabel, styles.deleteLabel]}>Delete</Text>
          </TouchableOpacity>
        )}
        {!onDownload && !onShare && !onDelete && (
          <Text style={styles.emptyHint}>Tap image to show actions</Text>
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SAFE_TOP,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  counter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 24,
    gap: 32,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    paddingVertical: 8,
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteIcon: {
    color: '#ff4444',
  },
  deleteLabel: {
    color: '#ff4444',
  },
  emptyHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
})

export default ActionOverlay
