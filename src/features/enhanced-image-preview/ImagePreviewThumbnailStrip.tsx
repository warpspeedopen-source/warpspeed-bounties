/**
 * ImagePreviewThumbnailStrip - Horizontal strip of thumbnail images at the bottom.
 * Bounty: Enhanced Image Preview (#6)
 */

import React, { useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import type { ImagePreviewItem } from './types';

interface ImagePreviewThumbnailStripProps {
  images: ImagePreviewItem[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

const THUMBNAIL_SIZE = 48;
const THUMBNAIL_SPACING = 6;

export const ImagePreviewThumbnailStrip: React.FC<ImagePreviewThumbnailStripProps> = ({
  images,
  currentIndex,
  onSelect,
}) => {
  const renderItem = useCallback(
    ({ item, index }: { item: ImagePreviewItem; index: number }) => (
      <TouchableOpacity
        onPress={() => onSelect(index)}
        style={[
          styles.thumbnail,
          index === currentIndex && styles.thumbnailActive,
        ]}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.thumbnailUri || item.uri }}
          style={styles.thumbnailImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    ),
    [currentIndex, onSelect]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        initialScrollIndex={Math.max(0, currentIndex - 3)}
        getItemLayout={(_, index) => ({
          length: THUMBNAIL_SIZE + THUMBNAIL_SPACING * 2,
          offset: (THUMBNAIL_SIZE + THUMBNAIL_SPACING * 2) * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: THUMBNAIL_SIZE + 16,
  },
  list: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 6,
    marginHorizontal: THUMBNAIL_SPACING,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: '#FFFFFF',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});
