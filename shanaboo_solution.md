 ```diff
--- /dev/null
+++ b/src/components/ImagePreview/ImagePreview.tsx
@@ -0,0 +1,289 @@
+import React, { useCallback, useEffect, useRef, useState } from 'react';
+import {
+  View,
+  StyleSheet,
+  Dimensions,
+  Modal,
+  Animated,
+  ActivityIndicator,
+  Platform,
+  Alert,
+} from 'react-native';
+import {
+  GestureHandlerRootView,
+  PanGestureHandler,
+  PinchGestureHandler,
+  State,
+  TapGestureHandler,
+} from 'react-native-gesture-handler';
+import Image from 'react-native-fast-image';
+import { ImagePreviewProps, ImageItem } from './ImagePreview.types';
+import { ImagePreviewActions } from './ImagePreviewActions';
+import { ImagePreviewIndicator } from './ImagePreviewIndicator';
+
+const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
+const SWIPE_THRESHOLD = 120;
+const DOUBLE_TAP_DELAY = 300;
+
+export const ImagePreview: React.FC<ImagePreviewProps> = ({
+  visible,
+  images,
+  initialIndex = 0,
+  onClose,
+  onIndexChange,
+  onDownload,
+  onShare,
+  onDelete,
+  enableDownload = false,
+  enableShare = false,
+  enableDelete = false,
+  backgroundColor = '#000000',
+  swipeToCloseEnabled = true,
+}) => {
+  const [currentIndex, setCurrentIndex] = useState(initialIndex);
+  const [isLoading, setIsLoading] = useState(true);
+  const [showActions, setShowActions] = useState(true);
+  
+  const scale = useRef(new Animated.Value(1)).current;
+  const translateX = useRef(new Animated.Value(0)).current;
+  const translateY = useRef(new Animated.Value(0)).current;
+  const panX = useRef(new Animated.Value(0)).current;
+  const opacity = useRef(new Animated.Value(1)).current;
+  
+  const lastTap = useRef(0);
+  const baseScale = useRef(1);
+  const baseTranslateX = useRef(0);
+  const baseTranslateY = useRef(0);
+
+  useEffect(() => {
+    if (visible) {
+      setCurrentIndex(initialIndex);
+      resetTransformations();
+    }
+  }, [visible, initialIndex]);
+
+  const resetTransformations = useCallback(() => {
+    scale.setValue(1);
+    translateX.setValue(0);
+    translateY.setValue(0);
+    panX.setValue(0);
+    opacity.setValue(1);
+    baseScale.current = 1;
+    baseTranslateX.current = 0;
+    baseTranslateY.current = 0;
+    setIsLoading(true);
+  }, [scale, translateX, translateY, panX, opacity]);
+
+  const handleClose = useCallback(() => {
+    resetTransformations();
+    onClose?.();
+  }, [onClose, resetTransformations]);
+
+  const handleIndexChange = useCallback((newIndex: number) => {
+    setCurrentIndex(newIndex);
+    onIndexChange?.(newIndex);
+    resetTransformations();
+  }, [onIndexChange, resetTransformations]);
+
+  const handlePinchEvent = useCallback((event: any) => {
+    const newScale = Math.max(1, Math.min(event.scale * baseScale.current, 4));
+    scale.setValue(newScale);
+  }, [scale]);
+
+  const handlePinchStateChange = useCallback((event: any) => {
+    if (event.nativeEvent.state === State.END) {
+      baseScale.current = Math.max(1, Math.min(event.nativeEvent.scale * baseScale.current, 4));
+      if (baseScale.current < 1.1) {
+        baseScale.current = 1;
+        Animated.spring(scale, {
+          toValue: 1,
+          useNativeDriver: true,
+        }).start();
+        Animated.spring(translateX, {
+          toValue: 0,
+          useNativeDriver: true,
+        }).start();
+        Animated.spring(translateY, {
+          toValue: 0,
+          useNativeDriver: true,
+        }).start();
+        baseTranslateX.current = 0;
+        baseTranslateY.current = 0;
+      }
+    }
+  }, [scale, translateX, translateY]);
+
+  const handlePanEvent = useCallback((event: any) => {
+    if (baseScale.current > 1) {
+      translateX.setValue(event.nativeEvent.translationX + baseTranslateX.current);
+      translateY.setValue(event.nativeEvent.translationY + baseTranslateY.current);
+    } else {
+      panX.setValue(event ⋅nativeEvent.translationX);
+      const newOpacity = Math.max(0.3, 1 - Math.abs(event.nativeEvent.translationX) / SCREEN_WIDTH);
+      opacity.setValue(newOpacity);
+    }
+  }, [translateX, translateY, panX, opacity, baseScale]);
+
+  const handlePanStateChange = useCallback((event: any) => {
+    if (event.nativeEvent.state === State.END) {
+      const { translationX, translationY, velocityX } = event.nativeEvent;
+      
+      if (baseScale.current > 1) {
+        baseTranslateX.current += translationX;
+        baseTranslateY.current += translationY;
+        
+        const maxTranslateX = (baseScale.current - 1) * SCREEN_WIDTH / 2;
+        const maxTranslateY = (baseScale.current - 1) * SCREEN_HEIGHT / 2;
+        
+        baseTranslateX.current = Math.max(-maxTranslateX, Math.min(maxTranslateX, baseTranslateX.current));
+        baseTranslateY.current = Math.max(-maxTranslateY, Math.min(maxTranslateY, baseTranslateY.current));
+        
+        Animated.spring(translateX, {
+          toValue: baseTranslateX.current,
+          useNativeDriver: true,
+        }).start();
+        Animated.spring(translateY, {
+          toValue: baseTranslateY.current,
+          useNativeDriver: true,
+        }).start();
+      } else if (Math.abs(translationX) > SWIPE_THRESHOLD || Math.abs(velocityX) > 500) {
+        const direction = translationX > 0 ? -1 : 1;
+        const newIndex = currentIndex + direction;
+        
+        if (newIndex >= 0 && newIndex < images.length) {
+          handleIndexChange(newIndex);
+        } else {
+          Animated.spring(panX, {
+            toValue: 0,
+            use