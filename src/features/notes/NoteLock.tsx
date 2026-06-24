import React from 'react';
import { TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { LockIcon } from '../../components/LockIcon';
import { useNoteLock } from './useNoteLock';
import { useBiometrics } from '../../services/auth/useBiometrics';

interface NoteLockProps {
  noteId: string;
}

export const NoteLock: React.FC<NoteLockProps> = ({ noteId }) => {
  const { lockState, lockNote, unlockNote, removeLock, isSessionExpired } = useNoteLock(noteId);
  const { authenticate } = useBiometrics();

  const handleToggleLock = async () => {
    if (lockState.isLocked) {
      const expired = isSessionExpired();
      if (expired) {
        const result = await authenticate('Unlock your note');
        if (result.success) {
          unlockNote();
        }
      } else {
        unlockNote();
      }
    } else {
      const result = await authenticate('Lock this note');
      if (result.success) {
        lockNote('biometric');
        Alert.alert('Note Locked', 'This note is now protected.');
      }
    }
  };

  const handleRemoveLock = async () => {
    const result = await authenticate('Remove note lock');
    if (result.success) {
      removeLock();
      Alert.alert('Lock Removed', 'This note is no longer protected.');
    }
  };

  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={handleToggleLock}
      onLongPress={lockState.isLocked ? handleRemoveLock : undefined}
    >
      <LockIcon isLocked={lockState.isLocked} size={22} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 8,
  },
});
