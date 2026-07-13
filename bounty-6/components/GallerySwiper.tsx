import React, { useCallback, useRef, useEffect } from 'react'
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
  ViewToken,
} from 'react-native'
import { GalleryItem } from '../types'
import ZoomableImage from './ZoomableImage'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface Props {
  items: GalleryItem[]
  initialIndex: number
  swipeLocked: boolean
  onIndexChange: (index: number) => void
  onSingleTap: () => void
  onZoomChange: (isZoomed: boolean) => void
  renderLoader?: (item: GalleryItem) => React.ReactElement
}

const GallerySwiper: React.FC<Props> = ({
  items,
  initialIndex,
  swipeLocked,
  onIndexChange,
  onSingleTap,
  onZoomChange,
  renderLoader,
}) => {
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    if (initialIndex > 0) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        })
      }, 50)
    }
  }, [initialIndex])

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
      onIndexChange(index)
    },
    [onIndexChange],
  )

  const onViewableItemsChanged = useRef(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      if (info.viewableItems.length > 0) {
        const first = info.viewableItems[0]
        onIndexChange(first.index ?? 0)
      }
    },
  ).current

  const renderItem = useCallback(
    ({ item }: { item: GalleryItem }) => (
      <View style={styles.page}>
        {renderLoader?.(item)}
        <ZoomableImage
          uri={item.uri}
          onZoomChange={onZoomChange}
          onSingleTap={onSingleTap}
        />
      </View>
    ),
    [onZoomChange, onSingleTap, renderLoader],
  )

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [],
  )

  return (
    <FlatList
      ref={listRef}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      bounces={false}
      scrollEnabled={!swipeLocked}
      onMomentumScrollEnd={onMomentumEnd}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      initialScrollIndex={initialIndex}
      removeClippedSubviews
      maxToRenderPerBatch={3}
      windowSize={3}
      style={styles.list}
    />
  )
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default GallerySwiper
