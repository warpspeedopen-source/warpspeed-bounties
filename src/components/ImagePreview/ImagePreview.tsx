import React, { useState, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, PanResponder, Animated, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView, PinchGestureHandler, State } from 'react-native-gesture-handler';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImagePreviewProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const imageRefs = useRef<(View | null)[]>([]);

  const resetTransformations = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(panX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(panY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  const onPinchEvent = Animated.event([
    {
      nativeEvent: {
        scale: scale,
      },
    },
  ], { useNativeDriver: true });

  const onPinchHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panX.setOffset(panX._value);
        panY.setOffset(panY._value);
        panX.setValue(0);
        panY.setValue(0);
      },
      onPanResponderMove: Animated.event([
        null,
        {
          dx: panX,
          dy: panY,
        },
      ], { useNativeDriver: false }), // dx/dy are not supported by useNativeDriver
      onPanResponderRelease: (evt, gestureState) => {
        panX.flattenOffset();
        panY.flattenOffset();

        const absoluteX = panX._value + panX.offset;
        const absoluteY = panY._value + panY.offset;

        // Swipe detection for navigation
        const SWIPE_THRESHOLD = screenWidth * 0.3;
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          if (gestureState.dx > 0 && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            resetTransformations();
          } else if (gestureState.dx < 0 && currentIndex < images.length - 1) {
            setCurrentIndex(currentIndex + 1);
            resetTransformations();
          } else {
            // Snap back if swipe is not enough or at edges
            Animated.spring(panX, { toValue: 0, useNativeDriver: false }).start();
            Animated.spring(panY, { toValue: 0, useNativeDriver: false }).start();
          }
        } else {
          // Snap back to center if not swiped
          Animated.spring(panX, { toValue: 0, useNativeDriver: false }).start();
          Animated.spring(panY, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const handleImageTap = () => {
    // If not zoomed, allow closing
    if (scale._value === 1 && panX._value === 0 && panY._value === 0) {
      onClose();
    }
  };

  const handleImageLongPress = () => {
    // Implement actions like download, share, delete here if needed
    console.log('Long press detected - implement actions');
  };

  const animatedStyle = {
    transform: [
      { scale: scale },
      { translateX: Animated.add(panX, translateX) },
      { translateY: Animated.add(panY, translateY) },
    ],
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          {/* Add close icon here */}
        </TouchableOpacity>

        <PinchGestureHandler
          onGestureEvent={onPinchEvent}
          onHandlerStateChange={onPinchHandlerStateChange}
        >
          <Animated.View style={styles.imageWrapper}>
            <PanResponderGestureHandler
              ref={ref => (imageRefs.current[currentIndex] = ref)}
              {...panResponder.panHandlers}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
            >
              <Animated.View style={[styles.imageContainer, animatedStyle]}>
                <Image
                  source={{ uri: images[currentIndex] }}
                  style={styles.image}
                  resizeMode="contain"
                  onPress={handleImageTap}
                  onLongPress={handleImageLongPress}
                />
              </Animated.View>
            </PanResponderGestureHandler>
          </Animated.View>
        </PinchGestureHandler>

        {images.length > 1 && (
          <View style={styles.pagination}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === currentIndex ? styles.activeDot : {}]}
              />
            ))}
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    height: screenHeight,
  },
  imageContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  pagination: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: 'white',
  },
});

export default ImagePreview;
