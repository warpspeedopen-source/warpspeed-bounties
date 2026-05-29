import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View, Dimensions } from 'react-native';

interface ZoomableViewProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

export const ZoomableView: React.FC<ZoomableViewProps> = ({ children, onSwipeLeft, onSwipeRight }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  let currentScale = 1;
  scale.addListener(({ value }) => { currentScale = value; });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        if (e.nativeEvent.touches.length === 2) {
          // Pinch to zoom
          const touch1 = e.nativeEvent.touches[0];
          const touch2 = e.nativeEvent.touches[1];
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          // Simplified scaling logic
          const newScale = Math.max(1, distance / 150);
          scale.setValue(newScale);
        } else if (e.nativeEvent.touches.length === 1 && currentScale > 1) {
          // Panning when zoomed
          translateX.setValue(gestureState.dx);
          translateY.setValue(gestureState.dy);
        } else if (e.nativeEvent.touches.length === 1 && currentScale === 1) {
           // Track swipe for navigation
           translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (currentScale === 1) {
          if (gestureState.dx > 50 && onSwipeRight) {
            onSwipeRight();
          } else if (gestureState.dx < -50 && onSwipeLeft) {
            onSwipeLeft();
          }
        } else if (currentScale < 1) {
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
        }
        
        if (currentScale <= 1) {
           Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
           Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View style={[styles.content, { transform: [{ scale }, { translateX }, { translateY }] }]}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  content: {
    width: windowWidth,
    height: windowHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
