import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useNoteLock } from '../hooks/useNoteLock';
import { BiometricAuth } from './BiometricAuth';
import { lockStore } from '../state/lockStore';

interface LockScreenProps {
  noteId: string;
  visible: boolean;
  onUnlocked: () => void;
  onDismiss?: () => void;
  title?: string;
}

export const LockScreen: React.FC<LockScreenProps> = observer(
  ({ noteId, visible, onUnlocked, onDismiss, title }) => {
    const { unlock, authenticateWithPIN } = useNoteLock({ noteId });
    const [mode, setMode] = useState<'biometric' | 'pin'>('biometric');
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pin, setPin] = useState('');
    const PIN_LENGTH = 4;

    useEffect(() => {
      if (visible) {
        setMode(
          lockStore.hasBiometrics && lockStore.authMethod !== 'pin'
            ? 'biometric'
            : 'pin',
        );
        setError(null);
        setPin('');
      }
    }, [visible]);

    const handleBiometricSuccess = useCallback(() => {
      lockStore.unlockNote(noteId);
      lockStore.unlockGlobally();
      onUnlocked();
    }, [noteId, onUnlocked]);

    const handleBiometricFallback = useCallback(() => {
      setMode('pin');
    }, []);

    const handlePINSubmit = useCallback(
      async (enteredPIN: string) => {
        setIsAuthenticating(true);
        setError(null);

        try {
          const result = authenticateWithPIN(enteredPIN);
          if (result.success) {
            lockStore.unlockNote(noteId);
            lockStore.unlockGlobally();
            onUnlocked();
          } else {
            setError(
              result.error ??
                'Incorrect PIN' +
                  (result.attemptsRemaining != null
                    ? ` (${result.attemptsRemaining} attempts left)`
                    : ''),
            );
          }
        } catch {
          setError('An unexpected error occurred');
        } finally {
          setIsAuthenticating(false);
        }
      },
      [noteId, onUnlocked, authenticateWithPIN],
    );

    const handleDigit = useCallback(
      (digit: string) => {
        if (pin.length >= PIN_LENGTH) return;
        const next = pin + digit;
        setPin(next);
        if (next.length === PIN_LENGTH) {
          handlePINSubmit(next);
          setPin('');
        }
      },
      [pin, handlePINSubmit],
    );

    const handleDelete = useCallback(() => {
      setPin((prev) => prev.slice(0, -1));
      setError(null);
    }, []);

    const showBiometrics =
      mode === 'biometric' && lockStore.hasBiometrics;
    const showPIN = mode === 'pin' && lockStore.hasPIN;
    const showSetupMessage = !lockStore.hasBiometrics && !lockStore.hasPIN;

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onDismiss}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconWrapper}>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed" size={40} color="#fff" />
              </View>
            </View>

            <Text style={styles.title}>
              {title ?? 'Note Locked'}
            </Text>
            <Text style={styles.subtitle}>
              Authenticate to view this note
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color="#e74c3c"
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {isAuthenticating && mode === 'pin' && (
              <ActivityIndicator
                size="large"
                color="#3498db"
                style={styles.loader}
              />
            )}

            {showBiometrics && (
              <BiometricAuth
                onAuthenticated={handleBiometricSuccess}
                onFallback={
                  lockStore.hasPIN ? handleBiometricFallback : undefined
                }
                promptMessage="Unlock your note"
              />
            )}

            {showPIN && (
              <View style={styles.pinSection}>
                {showBiometrics && (
                  <TouchableOpacity
                    onPress={handleBiometricFallback}
                    style={styles.switchRow}
                  >
                    <Ionicons
                      name={
                        lockStore.biometricStatus.biometryType === 'FaceID'
                          ? 'ios-faceid'
                          : 'finger-print'
                      }
                      size={18}
                      color="#3498db"
                    />
                    <Text style={styles.switchText}>
                      Use{' '}
                      {lockStore.biometricStatus.biometryType === 'FaceID'
                        ? 'Face ID'
                        : 'Touch ID'}
                    </Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.pinPrompt}>Enter PIN</Text>

                <View style={styles.dotsRow}>
                  {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        pin.length > i && styles.dotFilled,
                      ]}
                    />
                  ))}
                </View>

                <View style={styles.keypad}>
                  {[
                    ['1', '2', '3'],
                    ['4', '5', '6'],
                    ['7', '8', '9'],
                    ['', '0', 'DEL'],
                  ]
                    .flat()
                    .map((key, index) => (
                      <TouchableOpacity
                        key={`${key}-${index}`}
                        style={[
                          styles.key,
                          !key && styles.keyEmpty,
                        ]}
                        onPress={() => {
                          if (key === 'DEL') handleDelete();
                          else if (key) handleDigit(key);
                        }}
                        disabled={!key}
                        activeOpacity={0.6}
                      >
                        {key === 'DEL' ? (
                          <Ionicons
                            name="backspace-outline"
                            size={22}
                            color="#333"
                          />
                        ) : (
                          <Text
                            style={[
                              styles.keyText,
                              !key && styles.hidden,
                            ]}
                          >
                            {key}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}

            {showSetupMessage && (
              <View style={styles.setupMessage}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#999"
                />
                <Text style={styles.setupText}>
                  No authentication method configured.{'\n'}
                  Enable biometrics or set a PIN in settings.
                </Text>
              </View>
            )}

            {onDismiss && (
              <TouchableOpacity
                onPress={onDismiss}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrapper: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 32,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fde8e8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
    maxWidth: '100%',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    flexShrink: 1,
  },
  loader: {
    marginVertical: 20,
  },
  pinSection: {
    alignItems: 'center',
    width: '100%',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  switchText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
  pinPrompt: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 264,
    gap: 12,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  keyEmpty: {
    backgroundColor: 'transparent',
  },
  keyText: {
    fontSize: 26,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  hidden: {
    color: 'transparent',
  },
  setupMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
    maxWidth: '100%',
  },
  setupText: {
    color: '#999',
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
  },
  cancelButton: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  cancelText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
});
