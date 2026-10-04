<content>
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { Note } from '../../types/Note';

interface NoteLockIndicatorProps {
  note: Note;
}

export const NoteLockIndicator: React.FC<NoteLockIndicatorProps> = ({ note }) => {
  const { theme } = useTheme();
  
  if (!note.isLocked) {
    return null;
  }

  return (
    <View style={[styles.lockIndicator, { backgroundColor: theme.colors.background }]}>
      <Icon
        name="lock"
        size={16}
        color={theme.colors.primary}
      />
      <View style={[styles.lockIndicatorDot, { backgroundColor: theme.colors.primary }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  lockIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  lockIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: 4,
  },
});
</content>