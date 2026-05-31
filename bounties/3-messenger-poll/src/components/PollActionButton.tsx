/**
 * PollActionButton Component
 * A trigger button for initiating poll creation from the chat input area
 * Bounty #3: Messenger Group Chat Poll Creation and Voting UI
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

interface PollActionButtonProps {
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const PollActionButton: React.FC<PollActionButtonProps> = ({
  onPress,
  disabled = false,
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.container, disabled && styles.disabled, style]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>📊</Text>
      </View>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>Poll</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  labelDisabled: {
    color: '#AAAAAA',
  },
});
