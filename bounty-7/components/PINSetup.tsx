import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lockStore } from '../state/lockStore';

type SetupStep = 'enter_old' | 'enter_new' | 'confirm_new';

interface PINSetupProps {
  onComplete: () => void;
  onCancel?: () => void;
  mode?: 'create' | 'change';
}

export const PINSetup: React.FC<PINSetupProps> = ({
  onComplete,
  onCancel,
  mode = 'create',
}) => {
  const [step, setStep] = useState<SetupStep>(mode === 'change' ? 'enter_old' : 'enter_new');
  const [oldPIN, setOldPIN] = useState('');
  const [newPIN, setNewPIN] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleOldPINSubmit = useCallback(
    (pin: string) => {
      if (lockStore.verifyPIN(pin)) {
        setOldPIN(pin);
        setStep('enter_new');
        setError(null);
      } else {
        setError('Incorrect PIN. Try again.');
      }
    },
    [],
  );

  const handleNewPINSubmit = useCallback(
    (pin: string) => {
      setNewPIN(pin);
      setStep('confirm_new');
      setError(null);
    },
    [],
  );

  const handleConfirmSubmit = useCallback(
    (pin: string) => {
      if (pin === newPIN) {
        lockStore.setPIN(pin);
        lockStore.setAuthMethod(
          lockStore.hasBiometrics ? 'biometric_or_pin' : 'pin',
        );
        onComplete();
      } else {
        setError('PINs do not match. Try again.');
      }
    },
    [newPIN, onComplete],
  );

  let prompt: string;
  let onSubmit: (pin: string) => void;

  switch (step) {
    case 'enter_old':
      prompt = 'Enter Current PIN';
      onSubmit = handleOldPINSubmit;
      break;
    case 'enter_new':
      prompt = mode === 'change' ? 'Enter New PIN' : 'Create a PIN';
      onSubmit = handleNewPINSubmit;
      break;
    case 'confirm_new':
      prompt = 'Confirm PIN';
      onSubmit = handleConfirmSubmit;
      break;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={onCancel} style={styles.topCancel}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>

        <Ionicons
          name="lock-closed-outline"
          size={48}
          color="#3498db"
          style={styles.icon}
        />
        <Text style={styles.title}>
          {mode === 'change' ? 'Change PIN' : 'Set Up PIN'}
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#e74c3c" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <PINKeypad prompt={prompt} onSubmit={onSubmit} />
      </View>
    </SafeAreaView>
  );
};

interface PINKeypadProps {
  prompt: string;
  onSubmit: (pin: string) => void;
}

export const PINKeypad: React.FC<PINKeypadProps> = ({ prompt, onSubmit }) => {
  const [pin, setPin] = useState('');
  const PIN_LENGTH = 4;

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length >= PIN_LENGTH) return;
      const next = pin + digit;
      setPin(next);
      if (next.length === PIN_LENGTH) {
        setTimeout(() => {
          onSubmit(next);
          setPin('');
        }, 150);
      }
    },
    [pin, onSubmit],
  );

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'DEL'],
  ];

  return (
    <View style={styles.keypadContainer}>
      <Text style={styles.prompt}>{prompt}</Text>

      <View style={styles.dotsRow}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
        ))}
      </View>

      <View style={styles.keypad}>
        {keys.flat().map((key, index) => (
          <TouchableOpacity
            key={`${key}-${index}`}
            style={[
              styles.key,
              !key && styles.keyEmpty,
              key === 'DEL' && styles.keyDelete,
            ]}
            onPress={() => {
              if (key === 'DEL') handleDelete();
              else if (key) handleDigit(key);
            }}
            disabled={!key && key !== 'DEL' && !key}
            activeOpacity={0.6}
          >
            {key === 'DEL' ? (
              <Ionicons name="backspace-outline" size={24} color="#333" />
            ) : (
              <Text style={[styles.keyText, !key && styles.keyTextEmpty]}>
                {key}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

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
  topCancel: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fde8e8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
  },
  keypadContainer: {
    alignItems: 'center',
    width: '100%',
  },
  prompt: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
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
  keyDelete: {
    backgroundColor: '#f0f0f0',
  },
  keyText: {
    fontSize: 26,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  keyTextEmpty: {
    color: 'transparent',
  },
});
