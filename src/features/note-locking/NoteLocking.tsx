import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

interface NoteLockingProps { noteId: string; isLocked: boolean; onToggle: (locked: boolean) => void; }

export function NoteLocking({ noteId, isLocked, onToggle }: NoteLockingProps) {
  const [authenticating, setAuthenticating] = useState(false);

  const authenticate = useCallback(async () => {
    setAuthenticating(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) { Alert.alert('No biometric hardware'); return; }
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock note' });
      if (result.success) onToggle(!isLocked);
    } catch { Alert.alert('Authentication failed'); }
    finally { setAuthenticating(false); }
  }, [isLocked, onToggle]);

  return (
    <TouchableOpacity style={styles.container} onPress={authenticate} disabled={authenticating}>
      <Text style={styles.icon}>{isLocked ? '🔒' : '🔓'}</Text>
      <Text style={styles.label}>{isLocked ? 'Note Locked' : 'Lock Note'}</Text>
      <Text style={styles.hint}>{isLocked ? 'Tap to unlock' : 'Tap with biometrics'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 12, margin: 8 },
  icon: { fontSize: 32 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  hint: { fontSize: 12, color: '#888', marginTop: 4 },
});
