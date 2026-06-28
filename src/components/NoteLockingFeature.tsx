import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { 
  BiometricAuthManager, 
  useBiometricAuthentication 
} from './BiometricAuth';
import { 
  Note, 
  NoteStatus, 
  SecureStorage 
} from './SecureStorage';

// Types
interface LockSettings {
  requireReauthOnAppStart: boolean;
  timeoutPeriod: number; // in minutes
}

interface LockedNote {
  id: string;
  title: string;
  content: string;
  isLocked: boolean;
  lockedMethod: 'biometric' | 'pin' | 'none';
  pin?: string;
}

interface NoteLockProps {
  note: Note;
  onUnlock: (note: Note) => void;
  onLock: (method: 'biometric' | 'pin') => void;
  onRemoveLock: () => void;
  onChangeLockSettings: () => void;
  showLockScreen: boolean;
  onAuthenticationSuccess: () => void;
  onAuthenticationFailure: () => void;
  onAuthenticationCancel: () => void;
  renderLockedNotePreview: () => React.ReactNode;
  renderLockOptions: () => React.ReactNode;
  renderAuthenticationScreen: () => React.ReactNode;
}

// Main Component
export const NoteLockingFeature: React.FC<NoteLockProps> = ({ 
  note,
  onUnlock,
  onLock,
  onRemoveLock,
  onChangeLockSettings,
  onAuthenticationSuccess,
  onAuthenticationFailure,
  onAuthenticationCancel,
  renderLockedNotePreview,
  renderLockOptions,
  renderAuthenticationScreen
}) => {
  const [isLocked, setIsLocked] = useState(true);
  const [unlockMethod, setUnlockMethod] = useState<'biometric' | 'pin' | 'none'>('none');
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [maxPinAttempts, setMaxPinAttempts] = useState(3);
  
  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    try {
      const result = await BiometricAuthManager.authenticate();
      if (result.success) {
        onAuthenticationSuccess();
      } else {
        onAuthenticationFailure();
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      onAuthenticationFailure();
    }
  };
  
  // Handle PIN setup
  const handlePinSetup = () => {
    if (showPinSetup) {
      return (
        <View style={styles.pinSetupContainer}>
          <Text style={styles.title}>Set PIN for Note Locking</Text>
          <TextInput
            style={styles.pinInput}
            placeholder="Enter PIN"
            secureTextEntry
            value={pin}
            onChangeText={setPin}
          />
          <TextInput
            style={styles.pinInput}
            placeholder="Confirm PIN"
            secureTextEntry
            value={confirmPin}
            onChangeText={setConfirmPin}
          />
          {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}
          <TouchableOpacity 
            onPress={() => {
              if (pin !== confirmPin) {
                setPinError('PINs do not match');
                return;
              }
              if (pin.length < 4) {
                setPinError('PIN must be at least 4 digits');
                return;
              }
              // Save the PIN
              SecureStorage.savePin(pin);
              setShowPinSetup(false);
            }}
          >
            <Text>Save PIN</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };
  
  // Handle note locking
  const lockNote = (noteId: string) => {
    if (unlockMethod === 'biometric') {
      handleBi