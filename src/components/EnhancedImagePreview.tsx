import React, { useState, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  FlatList,
  Platform,
  PermissionsAndroid,
  Alert,
  ActionSheetIOS,
  SafeAreaView,
  ImageSourcePropType,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- TYPE DEFINITIONS ---

export type ImageSource = {
  uri: string;
  id?: string | number;
};

// --- ZOOMABLE IMAGE COMPONENT ---

interface ZoomableImageProps {
  source: ImageSourcePropType;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ source }) => {
  // Shared values for scale and translation
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Pan gesture handler
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Allow panning only when zoomed in
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      // Save the translation state
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Pinch gesture handler
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      // Clamp the scale to a minimum of 1 (original size)
      if (scale.value < 1) {
        // Reset all transformations if zoomed out too much
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
      savedScale.value = scale.value;
    });

  // Double tap gesture handler to zoom in/out
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value !== 1) {
        // If zoomed in, zoom out
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // If zoomed out, zoom in to a scale of 2
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  // Animated style for the image
  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Compose gestures: pan and pinch can happen simultaneously,
  // while double tap is a separate action.
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);
  const finalGesture = Gesture.Race(composedGesture, doubleTapGesture);

  return (
    <GestureDetector gesture={finalGesture}>
      <Animated.View style={styles.zoomableContainer}>
        <Animated.Image
          source={source}
          style={[styles.image, animatedImageStyle]}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
};

// --- ENHANCED IMAGE PREVIEW COMPONENT ---

export interface EnhancedImagePreviewProps {
  images: ImageSource[];
  visible: boolean;
  onClose: () => void;
  startIndex?: number;
  renderHeader?: (currentIndex: number) => React.ReactElement | null;
  renderFooter?: (currentIndex: number) => React.ReactElement | null;
  onShare?: (image: ImageSource) => Promise<void>;
  onDownload?: (image: ImageSource) => Promise<void>;
  onDelete?: (image: ImageSource) => Promise<void>;
  canShare?: boolean;
  canDownload?: boolean;
  canDelete?: boolean;
}

const EnhancedImagePreview: React.FC<EnhancedImagePreviewProps> = ({
  images,
  visible,
  onClose,
  startIndex = 0,
  renderHeader,
  renderFooter,
  onShare,
  onDownload,
  onDelete,
  canShare = true,
  canDownload = true,
  canDelete = false, // Deleting is a destructive action, default to false
}) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const flatListRef = useRef<FlatList>(null);

  const currentImage = images[currentIndex];

  // --- ACTION HANDLERS ---

  const handleShare = async () => {
    if (!currentImage?.uri) return;
    if (onShare) {
      await onShare(currentImage);
      return;
    }
    try {
      await Share.open({ url: currentImage.uri });
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Could not share the image.');
    }
  };

  const handleDownload = async () => {
    if (!currentImage?.uri) return;
    if (onDownload) {
      await onDownload(currentImage);
      return;
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Storage permission is required to download the image.');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    const path = `${RNFS.CachesDirectoryPath}/${new Date().toISOString()}.jpg`.replace(/:/g, '-');
    try {
      await RNFS.downloadFile({ fromUrl: currentImage.uri, toFile: path }).promise;
      // For a full implementation, consider saving to the device's gallery
      // using a library like `@react-native-community/cameraroll`.
      Alert.alert('Success', 'Image saved to app cache directory.');
    } catch (error) {
      console.error('Error downloading image:', error);
      Alert.alert('Error', 'Could not download the image.');
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (onDelete && currentImage) {
              await onDelete(currentImage);
              // The parent component should handle UI updates (e.g., removing the image from its list).
              // Often, you might want to close the preview after deletion.
              onClose();
            }
          },
        },
      ],
    );
  };

  const showActionSheet = () => {
    const options: string[] = [];
    const actions: (() => void)[] = [];
    const destructiveButtonIndex: number[] = [];

    if (canShare) {
      options.push('Share');
      actions.push(handleShare);
    }
    if (canDownload) {
      options.push('Download');
      actions.push(handleDownload);
    }
    if (canDelete) {
      options.push('Delete');
      actions.push(handleDelete);
      destructiveButtonIndex.push(options.length - 1);
    }

    if (actions.length === 0) return;

    options.push('Cancel');
    const cancelButtonIndex = options.length - 1;

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: options,
        cancelButtonIndex: cancelButtonIndex,
        destructiveButtonIndex: destructiveButtonIndex,
      },
      (buttonIndex) => {
        if (buttonIndex !== cancelButtonIndex) {
          actions[buttonIndex]();
        }
      },
    );
  };

  // --- RENDER LOGIC ---

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  const renderItem = ({ item }: { item: ImageSource }) => (
    <View style={styles.pageContainer}>
      <ZoomableImage source={item} />
    </View>
  );

  const DefaultHeader = () => (
    <SafeAreaView style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.headerButton}>
        <Text style={styles.headerButtonText}>✕</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }} />
      {(canShare || canDownload || canDelete) && (
        <TouchableOpacity onPress={showActionSheet} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>⋯</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );

  const DefaultFooter = () => (
    <View style={styles.footer}>
      {images.length > 1 &&
        images.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === currentIndex ? '#fff' : '#888' },
            ]}
          />
        ))}
    </View>
  );

  return (
    <Modal visible={visible} transparent={true} onRequestClose={onClose} animationType="fade">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          {renderHeader ? renderHeader(currentIndex) : <DefaultHeader />}
          <FlatList
            ref={flatListRef}
            data={images}
            renderItem={renderItem}
            keyExtractor={(item) => item.id?.toString() || item.uri}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={startIndex}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
          />
          {renderFooter ? renderFooter(currentIndex) : <DefaultFooter />}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

// --- STYLES ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  pageContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomableContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default EnhancedImagePreview;
