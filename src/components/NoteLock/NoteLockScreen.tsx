<content>
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useNoteLock } from '../../hooks/useNoteLock';
import { Note } from '../../types/Note';

interface NoteLockScreenProps {
  note: Note;
  onUnlock: () => void;
  onDismiss: () => void;
}

export const NoteLockScreen: React.FC<NoteLockScreenProps> = ({
  note,
  onUnlock,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const { authenticateWithBiometrics, authenticateWithPIN } = useAuth();
  const { unlockNote } = useNoteLock();
  const [authMethod, setAuthMethod] = useState<'biometrics' | 'pin'>('biometrics');
  const [isLoading, setIsLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  const handleBiometricAuth = async () => {
    setIsLoading(true);
    try {
      const success = await authenticateWithBiometrics();
      if (success) {
        await unlockNote(note.id);
        onUnlock();
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      Alert.alert('Authentication Failed', 'Could not authenticate with biometrics');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePINAuth = async () => {
    setIsLoading(true);
    try {
      const success = await authenticateWithPIN(pin);
      if (success) {
        await unlockNote(note.id);
        onUnlock();
        setPin('');
        setShowPinInput(false);
      } else {
        Alert.alert('Authentication Failed', 'Incorrect PIN');
      }
    } catch (error) {
      console.error('PIN authentication failed:', error);
      Alert.alert('Authentication Failed', 'Could not authenticate with PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthMethodChange = (method: 'biometrics' | 'pin') => {
    setAuthMethod(method);
    setShowPinInput(method === 'pin');
    setPin('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Locked Note
        </Text>
        <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
          <Text style={[styles.closeText, { color: theme.colors.text }]}>
            ×
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.subtitle, { color: theme.colors.secondaryText }]}>
        This note is locked. Please authenticate to view its contents.
      </Text>

      <View style={styles.authMethodsContainer}>
        <TouchableOpacity
          style={[
            styles.authMethodButton,
            authMethod === 'biometrics' && { 
              backgroundColor: theme.colors.primary + '20',
              borderColor: theme.colors.primary,
            },
            { borderColor: theme.colors.border },
          ]}
          onPress={() => handleAuthMethodChange('biometrics')}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.authMethodText,
              authMethod === 'biometrics' && { color: theme.colors.primary },
              { color: theme.colors.text },
            ]}
          >
            Biometrics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.authMethodButton,
            authMethod === 'pin' && { 
              backgroundColor: theme.colors.primary + '20',
              borderColor: theme.colors.primary,
            },
            { borderColor: theme.colors.border },
          ]}
          onPress={() => handleAuthMethodChange('pin')}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.authMethodText,
              authMethod === 'pin' && { color: theme.colors.primary },
              { color: theme.colors.text },
            ]}
          >
            PIN
          </Text>
        </TouchableOpacity>
      </View>

      {showPinInput && (
        <View style={styles.pinInputContainer}>
          <View style={[styles.pinInput, { borderColor: theme.colors.border }]}>
            <Text style={[styles.pinText, { color: theme.colors.text }]}>
              {pin.padEnd(4, '•')}
            </Text>
          </View>
          <View style={styles.pinKeypad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'delete'].map((num) => (
              <TouchableOpacity
                key={num === '' ? 'empty' : num}
                style={[styles.pinButton, num === '' && styles.pinButtonEmpty]}
                onPress={() => {
                  if (num === 'delete') {
                    setPin(prev => prev.slice(0, -1));
                  } else if (num !== '' && pin.length < 4) {
                    setPin(prev => prev + num.toString());
                  }
                }}
                disabled={isLoading}
              >
                {num === 'delete' ? (
                  <Text style={[styles.pinButtonText, { color: theme.colors.text }]}>⌫</Text>
                ) : num === '' ? null : (
                  <Text style={[styles.pinButtonText, { color: theme.colors.text }]}>{num}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.unlockButton, { backgroundColor: theme.colors.primary }]}
        onPress={authMethod === 'biometrics' ? handleBiometricAuth : handlePINAuth}
        disabled={isLoading || (showPinInput && pin.length !== 4)}
      >
        <Text style={styles.unlockButtonText}>
          {isLoading ? 'Authenticating...' : 'Unlock Note'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  authMethodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  authMethodButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  authMethodText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pinInputContainer: {
    marginBottom: 32,
  },
  pinInput: {
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pinText: {
    fontSize: 32,
    letterSpacing: 8,
    fontWeight: '300',
  },
  pinKeypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pinButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    backgroundColor: '#f0f0f0',
  },
  pinButtonEmpty: {
    width: 70,
    height: 70,
    margin: 8,
  },
  pinButtonText: {
    fontSize: 24,
    fontWeight: '500',
  },
  unlockButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  unlockButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
</content>