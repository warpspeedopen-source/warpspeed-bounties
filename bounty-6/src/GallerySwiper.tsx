import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { ZoomableImage } from './ZoomableImage';
import { ImageItem } from './types';

const { width, height } = Dimensions.get('window');

interface GallerySwiperProps {
  images: ImageItem[];
  initialIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export const GallerySwiper: React.FC<GallerySwiperProps> = ({
  images,
  initialIndex,
  onIndexChange,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = React.useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setCurrentIndex(index);
      onIndexChange(index);
    }
  }, [onIndexChange]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const renderItem = ({ item }: { item: ImageItem }) => (
    <View style={styles.imageContainer}>
      <ZoomableImage
        url={item.url}
        onSwipeVertical={onClose}
      />
    </View>
  );

  return (
    <FlatList
      ref={flatListRef}
      data={images}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={initialIndex}
      getItemLayout={(data, index) => ({
        length: width,
        offset: width * index,
        index,
      })}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      bounces={false}
    />
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
