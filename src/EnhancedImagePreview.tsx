import React, { useState, useEffect } from 'react';
import { Modal, View, Image, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { EnhancedImagePreviewProps } from './types';
import { ZoomableView } from './ZoomableView';
import { handleDownload, handleShare, handleDelete } from './ActionHelpers';

export const EnhancedImagePreview: React.FC<EnhancedImagePreviewProps> = ({
  images,
  initialIndex = 0,
  visible,
  onRequestClose,
  onDownload,
  onShare,
  onDelete
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  if (!visible || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const goNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <Modal visible={visible} transparent={true} onRequestClose={onRequestClose} animationType="fade">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onRequestClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.counterText}>{currentIndex + 1} / {images.length}</Text>
        </View>

        <ZoomableView onSwipeLeft={goNext} onSwipeRight={goPrev}>
          <Image source={{ uri: currentImage.uri }} style={styles.image} resizeMode="contain" />
        </ZoomableView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => handleDownload(currentImage, onDownload)} style={styles.actionButton}>
            <Text style={styles.actionText}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShare(currentImage, onShare)} style={styles.actionButton}>
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(currentImage, onDelete)} style={styles.actionButton}>
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    zIndex: 10,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  counterText: {
    color: 'white',
    fontSize: 16,
    alignSelf: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 40,
    zIndex: 10,
  },
  actionButton: {
    padding: 12,
  },
  actionText: {
    color: 'white',
    fontSize: 16,
  },
});
