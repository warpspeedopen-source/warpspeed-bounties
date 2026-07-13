import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useNoteLock } from '../hooks/useNoteLock';
import { LockState } from '../types';

interface LockToggleProps {
  noteId: string;
  size?: number;
  color?: string;
  lockedColor?: string;
  style?: ViewStyle;
  onToggle?: (nowLocked: boolean) => void;
}

export const LockToggle: React.FC<LockToggleProps> = observer(
  ({
    noteId,
    size = 22,
    color = '#666',
    lockedColor = '#e74c3c',
    style,
    onToggle,
  }) => {
    const { isLocked, lockState, toggle } = useNoteLock({ noteId });

    const isLoading =
      lockState === 'locking' || lockState === 'unlocking';

    const handlePress = async () => {
      if (isLoading) return;
      const wasLocked = isLocked;
      await toggle();
      onToggle?.(!wasLocked);
    };

    const iconName = isLocked ? 'lock-closed' : 'lock-open-outline';
    const iconColor = isLocked ? lockedColor : color;

    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.container, style]}
        disabled={isLoading}
        accessibilityLabel={isLocked ? 'Tap to unlock note' : 'Tap to lock note'}
        accessibilityRole="button"
        accessibilityState={{ disabled: isLoading }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Ionicons name={iconName} size={size} color={iconColor} />
        )}
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
});
