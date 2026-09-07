import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { ImageItem } from './types';

interface ActionOverlayProps {
  currentImage: ImageItem;
  currentIndex: number;
  totalImages: number;
  onClose: () => void;
  onDownload?: (image: ImageItem) => void;
  onShare?: (image: ImageItem) => void;
  onDelete?: (image: ImageItem) => void;
}

export const ActionOverlay: React.FC<ActionOverlayProps> = ({
  currentImage,
  currentIndex,
  totalImages,
  onClose,
  onDownload,
  onShare,
  onDelete,
}) => {
  return (
    <SafeAreaView style={styles.overlay} pointerEvents="box-none">
      <View style={styles.header} pointerEvents="box-none">
        <TouchableOpacity style={styles.iconButton} onPress={onClose}>
          <Text style={styles.iconText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {currentIndex + 1} / {totalImages}
        </Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.footer} pointerEvents="box-none">
        {onDownload && (
          <TouchableOpacity style={styles.iconButton} onPress={() => onDownload(currentImage)}>
            <Text style={styles.iconText}>Download</Text>
          </TouchableOpacity>
        )}
        {onShare && (
          <TouchableOpacity style={styles.iconButton} onPress={() => onShare(currentImage)}>
            <Text style={styles.iconText}>Share</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity style={styles.iconButton} onPress={() => onDelete(currentImage)}>
            <Text style={styles.iconText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 20,
  },
  iconButton: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  iconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  spacer: {
    width: 48, // matching iconButton width roughly to center the title
  },
});
