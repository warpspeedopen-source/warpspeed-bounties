import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Modal, 
  StyleSheet, 
  Dimensions,
  TouchableOpacity,
  Text,
  Alert
} from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureHandlerRootView, PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';

interface EnhancedImagePreviewProps {
  images: Array<{ uri: string }>;
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EnhancedImagePreview: React.FC<EnhancedImagePreviewProps> = ({
  images = [],
  initialIndex = 0,
  visible = false,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).2;
  const translateY = useRef(new Animated.Value(0)).current;
  const panRef = useRef(null);
  const pinchRef = useRef(null);
  
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (direction === 'right' && currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleDownload = () => {
    Alert.alert('Download functionality would be implemented here');
  };

  const handleShare = () => {
    Alert.alert('Share functionality would be implemented here');
  };

  const handleDelete = () => {
    Alert.alert('Delete functionality would be implemented here');
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler ref={panRef}>
        <Animated.View style={styles.gestureContainer}>
          <PinchGestureHandler ref={pinchRef}>
            <View style={styles.imageContainer}>
              {/* Image rendering and gesture handling logic would go here */}
            </View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black'
  },
  gestureContainer: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
    resizeMode: 'contain'
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16
  },
  button: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4
  },
  buttonText: {
    color: 'white',
    fontSize: 16
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8
  }
});

export default EnhancedImagePreview;