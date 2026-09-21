import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLock } from '../context/LockProvider';
import { useTailwind } from 'nativewind';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * Modal that appears when biometric auth fails or is unavailable.
 * Allows the user to enter a PIN (if set) or set a new PIN.
 */
export const LockScreen: React.FC<Props> = ({ visible, onClose }) => {
  const { verifyPin, setPin } = useLock();
  const [pin, setPinInput] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [mode, setMode] = useState<'enter' | 'setup'>('enter');
  const tw = useTailwind();

  const handleSubmit = async () => {
    if (mode === 'enter') {
      const ok = await verifyPin(pin);
      if (ok) {
        onClose();
      } else {
        Alert.alert('Invalid PIN', 'Please try again.');
      }
    } else {
      if (pin !== confirmPin) {
        Alert.alert('Mismatch', 'PINs do not match.');
        return;
      }
      await setPin(pin);
      Alert.alert('PIN Set', 'Your PIN has been saved.');
      setMode('enter');
    }
    setPinInput('');
    setConfirmPin('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={tw`flex-1 justify-center items-center bg-black/50`}>
        <View style={tw`bg-white rounded-lg p-6 w-80`}>
          <Text style={tw`text-lg font-medium mb-4`}>
            {mode === 'enter' ? 'Enter PIN' : 'Set a PIN'}
          </Text>
          <TextInput
            secureTextEntry
            keyboardType="numeric"
            placeholder="PIN"
            value={pin}
            onChangeText={setPinInput}
            style={tw`border border-gray-300 rounded p-2 mb-3`}
          />
          {mode === 'setup' && (
            <TextInput
              secureTextEntry
              keyboardType="numeric"
              placeholder="Confirm PIN"
              value={confirmPin}
              onChangeText={setConfirmPin}
              style={tw`border border-gray-300 rounded p-2 mb-3`}
            />
          )}
          <TouchableOpacity
            onPress={handleSubmit}
            style={tw`bg-blue-600 rounded p-2 mb-2`}
          >
            <Text style={tw`text-white text-center`}>
              {mode === 'enter' ? 'Unlock' : 'Save PIN'}
            </Text>
          </TouchableOpacity>

          {mode === 'enter' && (
            <TouchableOpacity onPress={() => setMode('setup')}>
              <Text style={tw`text-blue-600 text-center`}>Set a PIN</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onClose} style={tw`mt-3`}>
            <Text style={tw`text-center text-gray-500`}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
