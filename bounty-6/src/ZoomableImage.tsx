import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

interface ZoomableImageProps {
  url: string;
  onSwipeHorizontal?: (direction: 'left' | 'right') => void;
  onSwipeVertical?: () => void;
}

export const ZoomableImage: React.FC<ZoomableImageProps> = ({
  url,
  onSwipeHorizontal,
  onSwipeVertical,
}) => {
  const scale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(1, event.scale);
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (scale.value === 1) {
        if (event.translationX > 50 && onSwipeHorizontal) {
          onSwipeHorizontal('right');
        } else if (event.translationX < -50 && onSwipeHorizontal) {
          onSwipeHorizontal('left');
        }
        if (event.translationY > 100 && onSwipeVertical) {
          onSwipeVertical();
        }
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <GestureDetector gesture={composed}>
      <Animated.Image
        source={{ uri: url }}
        style={[styles.image, animatedStyle]}
        resizeMode="contain"
      />
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  image: {
    width,
    height,
  },
});
