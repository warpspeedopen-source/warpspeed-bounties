/**
 * ImagePreview Component - Main Entry Point
 * Full-screen image preview with zoom, pan, swipe, and action bar.
 * Bounty: Enhanced Image Preview (#6)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
  SafeAreaView,
  StatusBar,
  FlatList,
  Platform,
} from 'react-native';
import type {
  ImagePreviewItem,
  ImagePreviewAction,
  ImagePreviewConfig,
  GestureConfig,
} from './types';
import { ImagePreviewActionBar } from './ImagePreviewActionBar';
import { ImagePreviewThumbnailStrip } from './ImagePreviewThumbnailStrip';
import { ImagePreviewGestureLayer } from './ImagePreviewGestureLayer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImagePreviewProps {
  /** Array of images to preview */
  images: ImagePreviewItem[];
  /** Whether the preview modal is visible */
  visible: boolean;
  /** Starting image index */
  initialIndex?: number;
  /** Configuration for preview behavior */
  config?: ImagePreviewConfig;
  /** Called when preview is closed */
  onClose: () => void;
  /** Called when the active image changes */
  onImageChange?: (index: number, image: ImagePreviewItem) => void;
  /** Custom actions for the action bar */
  actions?: ImagePreviewAction[];
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  visible,
  initialIndex = 0,
  config = {},
  onClose,
  onImageChange,
  actions,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const [containerHeight, setContainerHeight] = useState(SCREEN_HEIGHT);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Reset index when preview opens
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setIsOverlayVisible(true);
      // Scroll to initial index
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 50);
    }
  }, [visible, initialIndex]);

  const currentImage = useMemo(() => images[currentIndex], [images, currentIndex]);

  const handleImageChange = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      onImageChange?.(index, images[index]);
    },
    [images, onImageChange]
  );

  const toggleOverlay = useCallback(() => {
    setIsOverlayVisible((prev) => {
      Animated.timing(fadeAnim, {
        toValue: prev ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return !prev;
    });
  }, [fadeAnim]);

  const handleSwipeLeft = useCallback(() => {
    if (currentIndex < images.length - 1) {
      const newIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
      handleImageChange(newIndex);
    }
  }, [currentIndex, images.length, handleImageChange]);

  const handleSwipeRight = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
      handleImageChange(newIndex);
    }
  }, [currentIndex, handleImageChange]);

  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
      setContainerWidth(event.nativeEvent.layout.width);
      setContainerHeight(event.nativeEvent.layout.height);
    },
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ImagePreviewItem; index: number }) => (
      <ImagePreviewGestureLayer
        image={item}
        isActive={index === currentIndex}
        config={config.gestures}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
        onTap={toggleOverlay}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onSwipeDismiss={onClose}
      />
    ),
    [currentIndex, config.gestures, containerWidth, containerHeight, toggleOverlay, handleSwipeLeft, handleSwipeRight, onClose]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: containerWidth,
      offset: containerWidth * index,
      index,
    }),
    [containerWidth]
  );

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        handleImageChange(viewableItems[0].index);
      }
    },
    [handleImageChange]
  );

  const viewabilityConfig = useMemo(
    () => ({ viewAreaCoveragePercentThreshold: 50 }),
    []
  );

  if (!visible || images.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
    >
      <StatusBar hidden={!isOverlayVisible} />
      <View
        style={[styles.container, { backgroundColor: config.backgroundColor || '#000000' }]}
        onLayout={handleLayout}
      >
        {/* Image carousel */}
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={getItemLayout}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialScrollIndex={initialIndex}
          windowSize={3}
          maxToRenderPerBatch={3}
          removeClippedSubviews
          style={styles.flatList}
        />

        {/* Overlay: action bar, counter, thumbnail strip */}
        <Animated.View
          style={[styles.overlay, { opacity: fadeAnim }]}
          pointerEvents={isOverlayVisible ? 'auto' : 'none'}
        >
          {/* Top bar */}
          {config.showActionBar !== false && (
            <ImagePreviewActionBar
              image={currentImage}
              actions={actions || config.actions || []}
              onClose={onClose}
              currentIndex={currentIndex}
              totalImages={images.length}
              showCounter={config.showImageCounter !== false && images.length > 1}
            />
          )}

          {/* Bottom area */}
          <SafeAreaView style={styles.bottomArea}>
            {/* Page indicator */}
            {config.showPageIndicator !== false && images.length > 1 && (
              <View style={styles.pageIndicator}>
                {images.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      idx === currentIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Thumbnail strip */}
            {config.showThumbnailStrip !== false && images.length > 1 && (
              <ImagePreviewThumbnailStrip
                images={images}
                currentIndex={currentIndex}
                onSelect={(index) => {
                  flatListRef.current?.scrollToIndex({ index, animated: true });
                  handleImageChange(index);
                }}
              />
            )}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  bottomArea: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default ImagePreview;
