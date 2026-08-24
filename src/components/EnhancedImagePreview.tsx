import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
  PanResponder,
  Share,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface PreviewImage {
  id: string;
  uri: string;
  canDelete?: boolean;
  canShare?: boolean;
  canDownload?: boolean;
}

interface EnhancedImagePreviewProps {
  visible: boolean;
  images: PreviewImage[];
  initialIndex: number;
  onClose: () => void;
}

const EnhancedImagePreview: React.FC<EnhancedImagePreviewProps> = ({
  visible,
  images,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateX.setOffset(translateX.__getValue());
        translateX.setValue(0);
        translateY.setOffset(translateY.__getValue());
        translateY.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [
          null,
          {
            dx: translateX,
            dy: translateY,
          },
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        translateX.flattenOffset();
        translateY.flattenOffset();

        if (Math.abs(gestureState.dx) > 100 && !isZoomed) {
          if (gestureState.dx > 0 && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
          } else if (gestureState.dx < 0 && currentIndex < images.length - 1) {
            setCurrentIndex(currentIndex + 1);
          }
        }
        if (!isZoomed) {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const handleDoubleTap = () => {
    if (isZoomed) {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      setIsZoomed(false);
    } else {
      Animated.spring(scale, { toValue: 2, useNativeDriver: true }).start();
      setIsZoomed(true);
    }
  };

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      handleDoubleTap();
    }
    lastTap.current = now;
  };

  const currentImage = images[currentIndex];

  const handleShare = async () => {
    try {
      await Share.share({ message: currentImage.uri });
    } catch (error) {
      Alert.alert('Error', 'Could not share image.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Image', 'Are you sure you want to delete this image?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete triggered') },
    ]);
  };

  if (!visible || !currentImage) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.counter}>
            {currentIndex + 1} / {images.length}
          </Text>
          <View style={styles.actions}>
            {currentImage.canShare && (
              <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            )}
            {currentImage.canDownload && (
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>Save</Text>
              </TouchableOpacity>
            )}
            {currentImage.canDelete && (
              <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.imageContainer} {...panResponder.panHandlers}>
          <TouchableOpacity activeOpacity={1} onPress={handleTap} style={styles.touchable}>
            <Animated.Image
              source={{ uri: currentImage.uri }}
              style={[
                styles.image,
                {
                  transform: [{ scale }, { translateX }, { translateY }],
                },
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  counter: {
    color: '#fff',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
  },
  deleteText: {
    color: '#ff4444',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});

export default EnhancedImagePreview;