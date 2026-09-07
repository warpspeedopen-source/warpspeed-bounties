import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NoteLockingService } from './NoteLockingService';

interface NoteLockScreenProps {
  noteId: string;
  onUnlockSuccess: () => void;
  onCancel?: () => void;
}

export const NoteLockScreen: React.FC<NoteLockScreenProps> = ({ noteId, onUnlockSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometrics();
    // Prompt biometrics automatically on mount if available
    handleBiometricAuth();
  }, []);

  const checkBiometrics = async () => {
    const available = await NoteLockingService.hasBiometrics();
    setIsBiometricAvailable(available);
  };

  const handleBiometricAuth = async () => {
    const success = await NoteLockingService.authenticateWithBiometrics();
    if (success) {
      onUnlockSuccess();
    }
  };

  const handlePinSubmit = async () => {
    if (!pin) {
      Alert.alert('Error', 'Please enter your PIN');
      return;
    }

    const isSuccess = await NoteLockingService.verifyNotePin(noteId, pin);
    if (isSuccess) {
      onUnlockSuccess();
    } else {
      Alert.alert('Error', 'Incorrect PIN');
      setPin('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Note Locked</Text>
      
      <Text style={styles.subtitle}>Enter PIN to unlock</Text>
      <TextInput
        style={styles.pinInput}
        secureTextEntry
        keyboardType="numeric"
        value={pin}
        onChangeText={setPin}
        maxLength={6}
        placeholder="••••••"
      />

      <TouchableOpacity style={styles.button} onPress={handlePinSubmit}>
        <Text style={styles.buttonText}>Unlock with PIN</Text>
      </TouchableOpacity>

      {isBiometricAvailable && (
        <TouchableOpacity style={[styles.button, styles.biometricButton]} onPress={handleBiometricAuth}>
          <Text style={styles.buttonText}>Use Biometrics</Text>
        </TouchableOpacity>
      )}

      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    width: '100%',
    padding: 15,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  biometricButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 15,
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
