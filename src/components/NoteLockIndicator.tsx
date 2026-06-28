import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NoteLockIndicatorProps {
  isLocked: boolean;
  onPress: () => void;
}

const NoteLockIndicator: React.FC<NoteLockIndicatorProps> = ({ isLocked, onPress }) => {
  return (
    <View style={styles.lockContainer}>
      <Ionicons 
        name={isLocked ? "lock-closed" : "lock-open"} 
        size={20} 
        color="#666" 
        onPress={onPress}
      />
      <Text style={styles.lockText}>
        {isLocked ? 'Locked' : 'Unlocked'}
      </Text>
    </View>
  );
};

const styles = {
  lockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10
  },
  lockText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333'
  }
};

export default NoteLockIndicator;