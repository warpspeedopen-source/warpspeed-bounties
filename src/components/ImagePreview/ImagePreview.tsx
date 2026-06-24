import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
  PanResponderInstance,
  PanResponderGestureState,
  GestureResponderEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImagePreviewProps {
  imageUris: string[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
  onDelete?: (index: number) => void;
  onDownload?: (uri: string) => void;
+}

interface ImagePreviewState {
  imageIndex: number;
  translateX: Animated.Value<number>;
  translateY: Animated.Value<number>;
  scale: Animated.Value<number>;
  translateX1: Animated.Value<number>;
  translateY1: Animated.Value<number>;
  scale1: Animated.Value<number>;
  constructor(props: ImagePreviewProps) {
    this.imageIndex = props.initialIndex;
    this.translateX = new Animated.Value(0);
    this.translateY = new Animated.Value(0);
    this.scale = new Animated.Value(1);
    this.translateX1 = new Animated.Value(0);
    this.translateY1 = new Animated.Value(0);
    this.scale1 = new Animated.Value(1);
  }
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ 
  imageUris, 
  initialIndex, 
  visible, 
  onClose,
  onDelete,
  onDownload
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [panResponder, setPanResponder] = useState<PanResponderInstance | null>(null);
  
  useEffect(() => {
    // Initialize with the first image dimensions
    if (imageUris[currentIndex]) {
      // Simulate getting image dimensions
      setImageDimensions({ width: screenWidth, height: screenHeight });
    }
  }, [currentIndex]);

  const handleSwipeLeft = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSwipeRight = () => {
    if (currentIndex < imageU0ris.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleImageChange = (newIndex: number) => {
    setCurrentIndex(newIndex);
  };

  const render = () => {
    return (
      <View style={styles.container}>
        <View>
          {imageUris.map((uri, index) => (
            <TouchableWithoutFeedback key={index} onPress={() => {}}>
              <View>
                {/*
                  <Image
                    source={{ uri: imageUris[index] }}
                    style={[styles.image, imageDimensions]}
                    resizeMode="contain"
                  />
                */}
              </View>
            </TouchableWithoutFeedback>
          ))}
        </View>
      </View>
    );
  };

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default ImagePreview;