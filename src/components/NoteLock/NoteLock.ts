import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useBiometry } from 'react-native-mlkit-ocr';

interface NoteLockProps {
  noteId: string;
  isLocked: boolean;
  onUnlock: (noteId: string) => void;
  onLock: (noteId: string) => void;
}

const NoteLock: React.FC<NoteLockProps> = ({ noteId, isLocked, onUnlock, onLock }) => {
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);
  
  useEffect(() => {
    checkBiometrySupport();
  }, []);
  
  const checkBiometrySupport = async () => {
    try {
      const { supported } = await useBiometry();
      setIsBiometricSupported(supported);
    } catch (error) {
      console.log('Biometry check failed', error);
    }
  };

  const handleBiometricUnlock = async () => {
    try {
      // Biometric authentication implementation would go here
      // This is a placeholder for the actual biometric auth logic
    } catch (error) {
      console.error('Biometric unlock failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.lockButton} onPress={() => handleBiometricUnlock()}>
        <Text>Unlock Note</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  lockButton: {
    padding: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 5
  }
});

export default NoteLock;