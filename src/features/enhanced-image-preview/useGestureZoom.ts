/**
 * Gesture & Zoom Hook for Image Preview
 * Handles pinch-to-zoom, pan, double-tap zoom, and swipe dismiss.
 * Bounty: Enhanced Image Preview (#6)
 */

import { useCallback, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureUpdateEvent,
  PinchGestureHandlerEventPayload,
  PanGestureHandlerEventPayload,
  TapGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import type { GestureConfig } from './types';

const DEFAULT_CONFIG: Required<GestureConfig> = {
  minScale: 0.5,
  maxScale: 5.0,
  enableDoubleTapZoom: true,
  doubleTapZoomLevel: 2.5,
  enableSwipeDismiss: true,
};

interface UseGestureZoomOptions {
  config?: GestureConfig;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDismiss?: () => void;
  containerWidth: number;
  containerHeight: number;
}

export function useGestureZoom(options: UseGestureZoomOptions) {
  const { config = {}, onSwipeLeft, onSwipeRight, onSwipeDismiss, containerWidth, containerHeight } = options;
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const isAtMinScale = useCallback(() => scale.value <= 1.01, [scale]);

  // --- Pinch gesture ---
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scale.value = Math.max(mergedConfig.minScale, Math.min(mergedConfig.maxScale, newScale));
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
      }
      savedScale.value = scale.value;
    });

  // --- Pan gesture ---
  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onUpdate((e) => {
      if (scale.value > 1) {
        // Pan when zoomed in
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      } else {
        // Swipe navigation when at normal scale
        translateX.value = savedTranslateX.value + e.translationX;
      }
    })
    .onEnd((e) => {
      if (scale.value <= 1) {
        const swipeThreshold = containerWidth * 0.25;
        const velocityThreshold = 800;

        if (e.translationX < -swipeThreshold || e.velocityX < -velocityThreshold) {
          if (onSwipeLeft) runOnJS(onSwipeLeft)();
        } else if (e.translationX > swipeThreshold || e.velocityX > velocityThreshold) {
          if (mergedConfig.enableSwipeDismiss && scale.value <= 1 && Math.abs(e.translationY) > containerHeight * 0.3) {
            if (onSwipeDismiss) runOnJS(onSwipeDismiss)();
          } else if (onSwipeRight) {
            runOnJS(onSwipeRight)();
          }
        }

        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
      } else {
        // Clamp pan when zoomed
        const maxPanX = (containerWidth * (scale.value - 1)) / 2;
        const maxPanY = (containerHeight * (scale.value - 1)) / 2;
        translateX.value = withTiming(
          Math.max(-maxPanX, Math.min(maxPanX, translateX.value)),
          { duration: 150 }
        );
        translateY.value = withTiming(
          Math.max(-maxPanY, Math.min(maxPanY, translateY.value)),
          { duration: 150 }
        );
      }
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // --- Double-tap gesture ---
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd((e) => {
      if (!mergedConfig.enableDoubleTapZoom) return;

      if (scale.value > 1.01) {
        // Zoom back to normal
        scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
        translateX.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(0, { duration: 300 });
      } else {
        // Zoom in to doubleTapZoomLevel centered on tap point
        scale.value = withTiming(mergedConfig.doubleTapZoomLevel, {
          duration: 300,
          easing: Easing.out(Easing.ease),
        });
        // Center on tap point
        const tapX = e.x - containerWidth / 2;
        const tapY = e.y - containerHeight / 2;
        translateX.value = withTiming(-tapX * (mergedConfig.doubleTapZoomLevel - 1), {
          duration: 300,
        });
        translateY.value = withTiming(-tapY * (mergedConfig.doubleTapZoomLevel - 1), {
          duration: 300,
        });
      }
      savedScale.value = scale.value > 1.01 ? mergedConfig.doubleTapZoomLevel : 1;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Compose gestures: pinch and pan run simultaneously, double-tap has priority
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

  const resetTransform = useCallback(() => {
    'worklet';
    scale.value = withTiming(1, { duration: 200 });
    translateX.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [scale, translateX, translateY, savedScale, savedTranslateX, savedTranslateY]);

  return {
    composedGesture,
    scale,
    translateX,
    translateY,
    resetTransform,
    isAtMinScale,
  };
}
