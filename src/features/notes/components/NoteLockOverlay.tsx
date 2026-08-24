import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNoteLock } from '../hooks/useNoteLock';
import { Ionicons } from '@expo/vector-icons';

interface NoteLockOverlayProps {
  noteId: string;
  timeoutMinutes?: number;
}

export const NoteLockOverlay: React.FC<NoteLockOverlayProps> = ({ noteId, timeoutMinutes = 5 }) => {
  const { isUnlocked, isAuthenticating, error, authenticate } = useNoteLock(noteId, timeoutMinutes);

  if (isUnlocked) return null;

  return (
    <View style={styles.overlay}>
      <Ionicons name='lock-closed' size={48} color='#fff' />
      <Text style={styles.title}>This note is locked</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity 
        style={styles.button} 
        onPress={authenticate}
        disabled={isAuthenticating}
      >
        {isAuthenticating ? (
          <ActivityIndicator color='#fff' />
        ) : (
          <Text style={styles.buttonText}>Unlock with Biometrics / PIN</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  error: {
    color: '#ff4444',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});