import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface PollActionButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export const PollActionButton: React.FC<PollActionButtonProps> = ({
  onPress,
  disabled = false,
}) => (
  <TouchableOpacity
    style={[styles.button, disabled && styles.buttonDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
    accessibilityLabel="Create poll"
    accessibilityRole="button"
  >
    <View style={styles.iconWrapper}>
      <Text style={styles.icon}>📊</Text>
    </View>
    <Text style={[styles.label, disabled && styles.labelDisabled]}>Poll</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
  },
  labelDisabled: {
    color: '#AEAEB2',
  },
});
