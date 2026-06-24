import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LockIconProps {
  isLocked: boolean;
  size?: number;
}

export const LockIcon: React.FC<LockIconProps> = ({ isLocked, size = 20 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.icon, { fontSize: size * 0.8 }]}>
        {isLocked ? '🔒' : '🔓'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
});
