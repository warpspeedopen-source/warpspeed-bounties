import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { authenticate } from '../utils/biometricAuth';

export const LockSettingsScreen: React.FC = () => {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometryType, setBiometryType] = useState<'touch' | 'face' | null>(null);
  
  // Check what type of biometric auth is available
  React.useEffect(() => {
    // This would check the device's biometric capabilities
    // Implementation would go here
  }, []);

  return (
    <View>
      <Text>Lock Settings</Text>
    </View>
  );
};