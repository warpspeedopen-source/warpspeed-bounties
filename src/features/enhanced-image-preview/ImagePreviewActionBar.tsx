/**
 * ImagePreviewActionBar - Top overlay bar with close, counter, and action buttons.
 * Bounty: Enhanced Image Preview (#6)
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { ImagePreviewItem, ImagePreviewAction } from './types';

interface ImagePreviewActionBarProps {
  image: ImagePreviewItem;
  actions: ImagePreviewAction[];
  onClose: () => void;
  currentIndex: number;
  totalImages: number;
  showCounter: boolean;
}

export const ImagePreviewActionBar: React.FC<ImagePreviewActionBarProps> = ({
  image,
  actions,
  onClose,
  currentIndex,
  totalImages,
  showCounter,
}) => {
  return (
    <View style={styles.container}>
      <SafeAreaWrapper>
        <View style={styles.row}>
          {/* Close button */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={hitSlop}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          {/* Image counter */}
          {showCounter && (
            <Text style={styles.counter}>
              {currentIndex + 1} / {totalImages}
            </Text>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            {actions
              .filter((a) => a.available)
              .map((action) => (
                <TouchableOpacity
                  key={action.key}
                  onPress={() => action.onPress(image)}
                  style={styles.actionButton}
                  hitSlop={hitSlop}
                >
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      </SafeAreaWrapper>
    </View>
  );
};

// Lightweight safe area wrapper (avoids requiring react-native-safe-area-context as a hard dep)
const SafeAreaWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.safeArea}>{children}</View>
);

const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  safeArea: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  counter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
});
