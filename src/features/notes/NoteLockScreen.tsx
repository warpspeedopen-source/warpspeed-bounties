import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useBiometrics } from '../../services/auth/useBiometrics';

interface NoteLockScreenProps {
  onUnlock: () => void;
  onCancel: () => void;
}

export const NoteLockScreen: React.FC<NoteLockScreenProps> = ({ onUnlock, onCancel }) => {
  const { isAuthenticated, authenticate } = useBiometrics();

  useEffect(() => {
    if (isAuthenticated) {
      onUnlock();
    }
  }, [isAuthenticated]);

  const handleUnlock = async () => {
    const result = await authenticate('Unlock your note');
    if (result.success) {
      onUnlock();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.lockBox}>
        <Text style={styles.lockEmoji}>🔒</Text>
        <Text style={styles.title}>Note Locked</Text>
        <Text style={styles.subtitle}>
          Authenticate to view this note
        </Text>
        <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
          <Text style={styles.unlockText}>Unlock</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  lockBox: {
    alignItems: 'center',
    padding: 40,
  },
  lockEmoji: { fontSize: 60, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 30 },
  unlockButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  unlockText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelButton: { padding: 10 },
  cancelText: { color: '#999', fontSize: 14 },
});
