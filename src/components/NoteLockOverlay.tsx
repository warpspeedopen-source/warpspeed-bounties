import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Button, SafeAreaView } from 'react-native';
import { useBiometrics } from '../hooks/useBiometrics';

interface NoteLockOverlayProps {
  noteId: string;
  isLocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
}

export const NoteLockOverlay: React.FC<NoteLockOverlayProps> = ({ 
  noteId, 
  isLocked, 
  onUnlock,
  onLock
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showLockOverlay, setShowLockOverlay] = useState(isLocked);
  
  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    try {
      // Biometric authentication implementation would go here
      // This is a placeholder for the actual biometric integration
      const success = await useBiometrics();
      if (success) {
        setShowLockOverlay(false);
        onUnlock();
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!showLockOverlay) {
    return null;
  }

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="none"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Note Locked</Text>
            <Text style={styles.message}>
              This note is locked. Authentication required to view content.
            </Text>
            <View style={styles.buttonContainer}>
              <Button title="Unlock with Biometrics" onPress={handleBiometricAuth} />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 400,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
});