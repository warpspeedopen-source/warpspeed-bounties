import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ImageAdjustments } from '../types';

interface AdjustControlsProps {
  adjustments: ImageAdjustments;
  onChange: (adjustments: ImageAdjustments) => void;
  onApply: () => void;
  onCancel: () => void;
}

/**
 * Slider-based controls for brightness and contrast adjustment.
 * Simple +/- buttons since React Native doesn't have Slider in core.
 */
export const AdjustControls: React.FC<AdjustControlsProps> = ({
  adjustments,
  onChange,
  onApply,
  onCancel,
}) => {
  const [localAdjustments, setLocalAdjustments] = useState<ImageAdjustments>(adjustments);

  const updateBrightness = (delta: number) => {
    const next = Math.max(-1, Math.min(1, localAdjustments.brightness + delta));
    const updated = { ...localAdjustments, brightness: next };
    setLocalAdjustments(updated);
    onChange(updated);
  };

  const updateContrast = (delta: number) => {
    const next = Math.max(-1, Math.min(1, localAdjustments.contrast + delta));
    const updated = { ...localAdjustments, contrast: next };
    setLocalAdjustments(updated);
    onChange(updated);
  };

  const reset = () => {
    const resetVal: ImageAdjustments = { brightness: 0, contrast: 0 };
    setLocalAdjustments(resetVal);
    onChange(resetVal);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adjust</Text>

      {/* Brightness */}
      <View style={styles.controlRow}>
        <Text style={styles.label}>Brightness</Text>
        <View style={styles.valueRow}>
          <TouchableOpacity
            style={styles.stepButton}
            onPress={() => updateBrightness(-0.1)}
            disabled={localAdjustments.brightness <= -1}
          >
            <Text style={styles.stepText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.valueText}>
            {Math.round(localAdjustments.brightness * 100)}%
          </Text>
          <TouchableOpacity
            style={styles.stepButton}
            onPress={() => updateBrightness(0.1)}
            disabled={localAdjustments.brightness >= 1}
          >
            <Text style={styles.stepText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contrast */}
      <View style={styles.controlRow}>
        <Text style={styles.label}>Contrast</Text>
        <View style={styles.valueRow}>
          <TouchableOpacity
            style={styles.stepButton}
            onPress={() => updateContrast(-0.1)}
            disabled={localAdjustments.contrast <= -1}
          >
            <Text style={styles.stepText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.valueText}>
            {Math.round(localAdjustments.contrast * 100)}%
          </Text>
          <TouchableOpacity
            style={styles.stepButton}
            onPress={() => updateContrast(0.1)}
            disabled={localAdjustments.contrast >= 1}
          >
            <Text style={styles.stepText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={reset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={onApply}>
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  valueText: {
    fontSize: 15,
    color: '#8E8E93',
    minWidth: 40,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  resetText: {
    color: '#FF9F0A',
    fontSize: 16,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  applyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdjustControls;
