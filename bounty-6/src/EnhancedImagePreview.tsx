import React, { useState } from 'react';
import { Modal, View, StyleSheet, StatusBar } from 'react-native';
import { GallerySwiper } from './GallerySwiper';
import { ActionOverlay } from './ActionOverlay';
import { EnhancedImagePreviewProps } from './types';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export const EnhancedImagePreview: React.FC<EnhancedImagePreviewProps> = ({
  images,
  initialIndex = 0,
  visible,
  onClose,
  onDownload,
  onShare,
  onDelete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!visible) {
    return null;
  }

  const currentImage = images[currentIndex] || images[0];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.background}>
          <GallerySwiper
            images={images}
            initialIndex={initialIndex}
            onIndexChange={setCurrentIndex}
            onClose={onClose}
          />
          <ActionOverlay
            currentImage={currentImage}
            currentIndex={currentIndex}
            totalImages={images.length}
            onClose={onClose}
            onDownload={onDownload}
            onShare={onShare}
            onDelete={onDelete}
          />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
    backgroundColor: '#000',
  },
});
