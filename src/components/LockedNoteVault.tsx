import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useNoteLock } from '../hooks/useNoteLock';

interface LockedNoteVaultProps {
  noteContent: React.ReactNode;
  isNoteLocked: boolean;
  onUnlockSuccess?: () => void;
}

export const LockedNoteVault: React.FC<LockedNoteVaultProps> = ({ 
  noteContent, 
  isNoteLocked,
  onUnlockSuccess 
}) => {
  const { isAuthenticated, authenticate, lockSettings } = useNoteLock();
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = async () => {
    setError('');
    const success = await authenticate(pinInput);
    if (success) {
      setPinInput('');
      onUnlockSuccess?.();
    } else {
      setError('Authentication failed. Please try again.');
    }
  };

  if (!isNoteLocked || isAuthenticated) {
    return <View style={styles.container}>{noteContent}</View>;
  }

  return (
    <View style={styles.lockedContainer}>
      <Text style={styles.lockedText}>This note is locked 🔒</Text>
      
      {lockSettings?.method === 'pin' && (
        <TextInput
          style={styles.pinInput}
          secureTextEntry
          placeholder="Enter PIN"
          value={pinInput}
          onChangeText={setPinInput}
          keyboardType="numeric"
        />
      )}
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <Button 
        title={lockSettings?.method === 'biometrics' ? "Unlock with Biometrics" : "Unlock with PIN"} 
        onPress={handleUnlock} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  lockedText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  pinInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
  },
});
