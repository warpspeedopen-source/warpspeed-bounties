import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MailLabel, LABEL_ICONS } from '../types';

interface CategoryButtonsProps {
  activeLabel: MailLabel;
  onLabelChange: (label: MailLabel) => void;
  counts?: Record<MailLabel, number>;
}

const LABEL_NAMES: Record<MailLabel, string> = {
  primary: 'Primary',
  promotions: 'Promotions',
  updates: 'Updates',
};

/**
 * Category buttons for filtering emails by label.
 */
export const CategoryButtons: React.FC<CategoryButtonsProps> = ({
  activeLabel,
  onLabelChange,
  counts = { primary: 0, promotions: 0, updates: 0 },
}) => {
  const labels: MailLabel[] = ['primary', 'promotions', 'updates'];

  return (
    <View style={styles.container}>
      {labels.map((label) => (
        <TouchableOpacity
          key={label}
          style={[styles.button, activeLabel === label && styles.buttonActive]}
          onPress={() => onLabelChange(label)}
        >
          <Text style={styles.icon}>
            {label === 'primary' && '⭐'}
            {label === 'promotions' && '🏷️'}
            {label === 'updates' && '🔄'}
          </Text>
          <Text style={[styles.label, activeLabel === label && styles.labelActive]}>
            {LABEL_NAMES[label]}
          </Text>
          {counts[label] > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{counts[label]}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    gap: 6,
  },
  buttonActive: {
    backgroundColor: '#007AFF',
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3A3A3C',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default CategoryButtons;
