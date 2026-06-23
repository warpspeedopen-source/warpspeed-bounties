/**
 * ImagePreviewGestureLayer - Handles zoom, pan, and tap gestures for a single image.
 * Bounty: Enhanced Image Preview (#6)
 */

import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useGestureZoom } from './useGestureZoom';
import type { ImagePreviewItem, GestureConfig } from './types';

interface ImagePreviewGestureLayerProps {
  image: ImagePreviewItem;
  isActive: boolean;
  config?: GestureConfig;
  containerWidth: number;
  containerHeight: number;
  onTap: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeDismiss: () => void;
}

export const ImagePreviewGestureLayer: React.FC<ImagePreviewGestureLayerProps> = ({
  image,
  isActive,
  config,
  containerWidth,
  containerHeight,
  onTap,
  onSwipeLeft,
  onSwipeRight,
  onSwipeDismiss,
}) => {
  const { composedGesture, scale, translateX, translateY, resetTransform } = useGestureZoom({
    config,
    containerWidth,
    containerHeight,
    onSwipeLeft,
    onSwipeRight,
    onSwipeDismiss,
  });

  // Reset transform when this image becomes inactive
  useEffect(() => {
    if (!isActive) {
      resetTransform();
    }
  }, [isActive, resetTransform]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={[styles.container, { width: containerWidth, height: containerHeight }]}>
      <Animated.View style={[styles.imageWrapper, animatedStyle]}>
        <Animated.Image
          source={{ uri: image.uri }}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel={image.filename || `Image ${image.id}`}
        />
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
