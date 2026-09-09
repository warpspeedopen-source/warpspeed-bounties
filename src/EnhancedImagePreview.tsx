import React, { useCallback, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  StatusBar,
  Dimensions,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { handleDownload, handleShare, handleDelete } from './utils/actionHelpers';
import type { ImageItem } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============== 类型定义 ==============
export interface EnhancedImagePreviewProps {
  visible: boolean;
  images: ImageItem[];
  initialIndex?: number;
  onClose: () => void;
  onDownload?: (image: ImageItem, index: number) => void;
  onShare?: (image: ImageItem, index: number) => void;
  onDelete?: (image: ImageItem, index: number) => void;
  showCounter?: boolean;
  showActionBar?: boolean;
  minScale?: number;
  maxScale?: number;
}

// ============== 常量 ==============
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
};

const DOUBLE_TAP_SCALE = 2.5;
const MIN_SCALE = 1;
const MAX_SCALE = 5;

// ============== 主组件 ==============
const EnhancedImagePreview: React.FC<EnhancedImagePreviewProps> = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
  onDownload,
  onShare,
  onDelete,
  showCounter = true,
  showActionBar = true,
  minScale = MIN_SCALE,
  maxScale = MAX_SCALE,
}) => {
  // 当前图片索引
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  // 手势状态共享值
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // 双击检测
  const lastTapTime = useSharedValue(0);
  const isDoubleTap = useSharedValue(false);

  // 重置状态
  const resetTransform = useCallback(() => {
    'worklet';
    scale.value = withSpring(1, SPRING_CONFIG);
    savedScale.value = 1;
    translateX.value = withSpring(0, SPRING_CONFIG);
    translateY.value = withSpring(0, SPRING_CONFIG);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, []);

  // 更新索引
  const updateIndex = useCallback((newIndex: number) => {
    setCurrentIndex(newIndex);
  }, []);

  // 切换到指定图片 - 使用 runOnJS 确保线程安全
  const switchToImageJS = useCallback(
    (direction: number) => {
      const newIndex = currentIndex + direction;
      if (newIndex >= 0 && newIndex < images.length) {
        setCurrentIndex(newIndex);
        // 切换时重置缩放
        scale.value = withSpring(1, SPRING_CONFIG);
        savedScale.value = 1;
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    },
    [currentIndex, images.length, scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]
  );

  // 在 worklet 中调用的切换函数
  const switchToImage = useCallback(
    (direction: number) => {
      switchToImageJS(direction);
    },
    [switchToImageJS]
  );

  // 检查是否可以切换
  const canSwipe = useCallback(() => {
    return scale.value === 1;
  }, []);

  // 双击手势
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart((event) => {
      'worklet';
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTapTime.value;

      if (timeDiff < 300 && !isDoubleTap.value) {
        // 双击
        isDoubleTap.value = true;
        const currentScale = scale.value;

        if (currentScale > 1) {
          // 缩小回1
          resetTransform();
        } else {
          // 放大到 DOUBLE_TAP_SCALE
          const tapX = event.x - SCREEN_WIDTH / 2;
          const tapY = event.y - SCREEN_HEIGHT / 2;

          scale.value = withSpring(DOUBLE_TAP_SCALE, SPRING_CONFIG);
          savedScale.value = DOUBLE_TAP_SCALE;

          translateX.value = withSpring(-tapX * (DOUBLE_TAP_SCALE - 1), SPRING_CONFIG);
          translateY.value = withSpring(-tapY * (DOUBLE_TAP_SCALE - 1), SPRING_CONFIG);
          savedTranslateX.value = -tapX * (DOUBLE_TAP_SCALE - 1);
          savedTranslateY.value = -tapY * (DOUBLE_TAP_SCALE - 1);
        }
      } else {
        isDoubleTap.value = false;
      }

      lastTapTime.value = currentTime;
    });

  // 捏合缩放手势
  const pinchGesture = Gesture.Pinch()
    .onStart((event) => {
      'worklet';
      savedScale.value = scale.value;
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    })
    .onUpdate((event) => {
      'worklet';
      const newScale = savedScale.value * event.scale;
      scale.value = Math.min(Math.max(newScale, minScale), maxScale);

      // 缩放时调整平移
      if (scale.value > 1) {
        const scaleDiff = scale.value / savedScale.value;
        const centerX = focalX.value - SCREEN_WIDTH / 2;
        const centerY = focalY.value - SCREEN_HEIGHT / 2;

        translateX.value = savedTranslateX.value + centerX * (scaleDiff - 1);
        translateY.value = savedTranslateY.value + centerY * (scaleDiff - 1);
      }
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;

      // 如果缩小到1以下，重置
      if (scale.value < minScale) {
        resetTransform();
      }

      // 限制边界
      clampTranslation();
    });

  // 平移手势
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      'worklet';
      if (scale.value > 1) {
        // 缩放状态下平移
        const maxTranslateX = ((scale.value - 1) * SCREEN_WIDTH) / 2;
        const maxTranslateY = ((scale.value - 1) * SCREEN_HEIGHT) / 2;

        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;

        // 弹性边界
        if (translateX.value > maxTranslateX) {
          translateX.value = maxTranslateX + (translateX.value - maxTranslateX) * 0.3;
        } else if (translateX.value < -maxTranslateX) {
          translateX.value = -maxTranslateX + (translateX.value + maxTranslateX) * 0.3;
        }

        if (translateY.value > maxTranslateY) {
          translateY.value = maxTranslateY + (translateY.value - maxTranslateY) * 0.3;
        } else if (translateY.value < -maxTranslateY) {
          translateY.value = -maxTranslateY + (translateY.value + maxTranslateY) * 0.3;
        }
      } else {
        // 未缩放时检测滑动切换
        const swipeThreshold = 80;
        const velocityThreshold = 500;

        if (Math.abs(event.translationX) > swipeThreshold && Math.abs(event.velocityX) > velocityThreshold) {
          if (event.translationX > 0) {
            // 向右滑，切换上一张
            runOnJS(switchToImage)(-1);
          } else {
            // 向左滑，切换下一张
            runOnJS(switchToImage)(1);
          }
          // 重置位置
          translateX.value = withSpring(0, SPRING_CONFIG);
          translateY.value = withSpring(0, SPRING_CONFIG);
        }
      }
    })
    .onEnd(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;

      // 缩放状态下限制边界
      if (scale.value > 1) {
        clampTranslation();
      }
    });

  // 限制平移边界
  const clampTranslation = () => {
    'worklet';
    const maxTranslateX = ((scale.value - 1) * SCREEN_WIDTH) / 2;
    const maxTranslateY = ((scale.value - 1) * SCREEN_HEIGHT) / 2;

    if (translateX.value > maxTranslateX) {
      translateX.value = withSpring(maxTranslateX, SPRING_CONFIG);
    } else if (translateX.value < -maxTranslateX) {
      translateX.value = withSpring(-maxTranslateX, SPRING_CONFIG);
    }

    if (translateY.value > maxTranslateY) {
      translateY.value = withSpring(maxTranslateY, SPRING_CONFIG);
    } else if (translateY.value < -maxTranslateY) {
      translateY.value = withSpring(-maxTranslateY, SPRING_CONFIG);
    }
  };

  // 组合手势
  const composedGesture = Gesture.Simultaneous(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  // 图片动画样式
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // 背景透明度动画
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(visible ? 1 : 0, { duration: 200 }),
    };
  });

  // 关闭处理
  const handleClose = useCallback(() => {
    scale.value = withTiming(1, { duration: 200 });
    translateX.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  // 下载处理 - 使用真实的 actionHelpers
  const handleDownload = useCallback(() => {
    const currentImage = images[currentIndex];
    if (!currentImage) return;

    if (onDownload) {
      // 调用方自定义处理
      onDownload(currentImage, currentIndex);
    } else {
      // 使用真实下载实现
      handleDownload({
        url: currentImage.uri,
        filename: `image_${Date.now()}.jpg`,
      });
    }
  }, [images, currentIndex, onDownload]);

  // 分享处理 - 使用真实的 actionHelpers
  const handleShare = useCallback(() => {
    const currentImage = images[currentIndex];
    if (!currentImage) return;

    if (onShare) {
      // 调用方自定义处理
      onShare(currentImage, currentIndex);
    } else {
      // 使用真实分享实现
      handleShare({
        url: currentImage.uri,
        title: 'Share Image',
      });
    }
  }, [images, currentIndex, onShare]);

  // 删除处理 - 使用真实的 actionHelpers
  const handleDeleteAction = useCallback(() => {
    const currentImage = images[currentIndex];
    if (!currentImage) return;

    handleDelete(
      {
        title: 'Delete Image',
        message: 'Are you sure you want to delete this image? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
      () => {
        // 确认后调用方处理
        if (onDelete) {
          onDelete(currentImage, currentIndex);
        }
      }
    );
  }, [images, currentIndex, onDelete]);

  // 可见性变化时重置
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
    return () => {
      // 组件卸载时清理动画状态
      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
    };
  }, [visible, initialIndex, scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

  if (!visible) return null;

  const currentImage = images[currentIndex] || { uri: '' };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
      <Animated.View style={[styles.container, backdropAnimatedStyle]}>
        {/* 顶部栏 */}
        <View style={styles.header}>
          {showCounter && images.length > 1 && (
            <View style={styles.counterContainer}>
              <Text style={styles.counterText}>
                {currentIndex + 1} / {images.length}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            accessibilityLabel="Close preview"
            accessibilityRole="button"
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        {/* 图片区域 */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={styles.imageContainer}>
            <Animated.Image
              source={{ uri: currentImage.uri }}
              style={[styles.image, imageAnimatedStyle]}
              resizeMode="contain"
              accessibilityLabel={`Image ${currentIndex + 1} of ${images.length}`}
            />
          </Animated.View>
        </GestureDetector>

        {/* 底部操作栏 */}
        {showActionBar && (
          <View style={styles.actionBar}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={handleDownload}
              accessibilityLabel="Download image"
              accessibilityRole="button"
            >
              <Text style={styles.actionIcon}>↓</Text>
              <Text style={styles.actionText}>Save</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={handleShare}
              accessibilityLabel="Share image"
              accessibilityRole="button"
            >
              <Text style={styles.actionIcon}>↗</Text>
              <Text style={styles.actionText}>Share</Text>
            </Pressable>

            {onDelete && (
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={handleDeleteAction}
                accessibilityLabel="Delete image"
                accessibilityRole="button"
              >
                <Text style={[styles.actionIcon, styles.deleteIcon]}>🗑</Text>
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* 左右切换指示器 */}
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity
                style={[styles.swipeIndicator, styles.swipeLeft]}
                onPress={() => switchToImage(-1)}
                accessibilityLabel="Previous image"
              >
                <Text style={styles.swipeIndicatorText}>‹</Text>
              </TouchableOpacity>
            )}
            {currentIndex < images.length - 1 && (
              <TouchableOpacity
                style={[styles.swipeIndicator, styles.swipeRight]}
                onPress={() => switchToImage(1)}
                accessibilityLabel="Next image"
              >
                <Text style={styles.swipeIndicatorText}>›</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </Animated.View>
    </Modal>
  );
};

// ============== 样式 ==============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  counterContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  counterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
    marginTop: -2,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  actionBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    paddingHorizontal: 20,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 70,
  },
  actionButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ scale: 0.95 }],
  },
  actionIcon: {
    fontSize: 22,
    color: '#fff',
    marginBottom: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteIcon: {
    color: '#ff6b6b',
  },
  deleteText: {
    color: '#ff6b6b',
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeLeft: {
    left: 15,
  },
  swipeRight: {
    right: 15,
  },
  swipeIndicatorText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
});

export default EnhancedImagePreview;
