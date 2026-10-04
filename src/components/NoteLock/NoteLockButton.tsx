<content>
import React, { useState } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useNoteLock } from '../../hooks/useNoteLock';
import { Note } from '../../types/Note';

interface NoteLockButtonProps {
  note: Note;
  onLockPress: () => void;
  onUnlockPress: () => void;
}

export const NoteLockButton: React.FC<NoteLockButtonProps> = ({
  note,
  onLockPress,
  onUnlockPress,
}) => {
  const { theme } = useTheme();
  const { isLocked } = useNoteLock();
  const [isLockedState, setIsLockedState] = useState(isLocked(note.id));

  const handleLockPress = () => {
    setIsLockedState(true);
    onLockPress();
  };

  const handleUnlockPress = () => {
    setIsLockedState(false);
    onUnlockPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.lockButton,
        { backgroundColor: theme.colors.background },
      ]}
      onPress={isLockedState ? handleUnlockPress : handleLockPress}
      hitSlop={10}
    >
      <View style={styles.lockIconContainer}>
        <Icon
          name={isLockedState ? 'lock' : 'lock-open'}
          size={24}
          color={theme.colors.primary}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  lockButton: {
    borderRadius: 20,
    padding: 8,
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  lockIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
</content>