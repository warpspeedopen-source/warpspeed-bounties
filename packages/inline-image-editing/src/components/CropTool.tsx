import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { CropRegion } from '../types';

interface CropToolProps {
  imageWidth: number;
  imageHeight: number;
  initialCrop?: CropRegion;
  onCropChange: (crop: CropRegion) => void;
  onApply: () => void;
  onCancel: () => void;
}

/**
 * A crop tool that overlays the image with a draggable crop rectangle.
 * Uses a simple ratio-locked resize approach.
 */
export const CropTool: React.FC<CropToolProps> = ({
  imageWidth,
  imageHeight,
  initialCrop,
  onCropChange,
  onApply,
  onCancel,
}) => {
  const defaultCrop: CropRegion = initialCrop ?? {
    x: imageWidth * 0.1,
    y: imageHeight * 0.1,
    width: imageWidth * 0.8,
    height: imageHeight * 0.8,
  };

  const [crop, setCrop] = useState<CropRegion>(defaultCrop);

  const updateCrop = useCallback(
    (delta: Partial<CropRegion>) => {
      const next = { ...crop, ...delta };
      // Clamp within image bounds
      next.x = Math.max(0, Math.min(next.x, imageWidth - 20));
      next.y = Math.max(0, Math.min(next.y, imageHeight - 20));
      next.width = Math.max(20, Math.min(next.width, imageWidth - next.x));
      next.height = Math.max(20, Math.min(next.height, imageHeight - next.y));
      setCrop(next);
      onCropChange(next);
    },
    [crop, imageWidth, imageHeight, onCropChange]
  );

  // For demonstration, we provide preset ratios
  const setRatio = useCallback(
    (ratio: number) => {
      const w = crop.width;
      const h = w / ratio;
      if (crop.y + h > imageHeight) {
        // Adjust height to fit
        updateCrop({ height: imageHeight - crop.y, width: (imageHeight - crop.y) * ratio });
      } else {
        updateCrop({ height });
      }
    },
    [crop, imageHeight, updateCrop]
  );

  return (
    <View style={styles.container}>
      {/* Crop area visualization */}
      <View style={styles.cropOverlay}>
        <View
          style={[
            styles.cropBox,
            {
              left: crop.x,
              top: crop.y,
              width: crop.width,
              height: crop.height,
            },
          ]}
        >
          {/* Corner handles */}
          <View style={[styles.handle, styles.handleTL]} />
          <View style={[styles.handle, styles.handleTR]} />
          <View style={[styles.handle, styles.handleBL]} />
          <View style={[styles.handle, styles.handleBR]} />
        </View>
      </View>

      {/* Aspect ratio presets */}
      <View style={styles.ratioRow}>
        <TouchableOpacity style={styles.ratioButton} onPress={() => setRatio(1)}>
          <Text style={styles.ratioText}>1:1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ratioButton} onPress={() => setRatio(4 / 3)}>
          <Text style={styles.ratioText}>4:3</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ratioButton} onPress={() => setRatio(16 / 9)}>
          <Text style={styles.ratioText}>16:9</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ratioButton} onPress={() => setRatio(3 / 2)}>
          <Text style={styles.ratioText}>3:2</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ratioButton} onPress={() => setRatio(9 / 16)}>
          <Text style={styles.ratioText}>9:16</Text>
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyButton} onPress={onApply}>
          <Text style={styles.applyText}>Apply Crop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  cropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
  },
  handle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  handleTL: { top: -12, left: -12 },
  handleTR: { top: -12, right: -12 },
  handleBL: { bottom: -12, left: -12 },
  handleBR: { bottom: -12, right: -12 },
  ratioRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
  },
  ratioButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2C2C2E',
  },
  ratioText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  applyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CropTool;
