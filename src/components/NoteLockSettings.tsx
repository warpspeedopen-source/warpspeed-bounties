import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { AuthService } from '../services/AuthService';
import { LockSettings, AuthMethod } from '../types';

export const NoteLockSettings: React.FC = () => {
  const [settings, setSettings] = useState<LockSettings>({
    enabled: false,
    method: 'biometrics',
    timeoutMinutes: 5,
  });
  const [newPin, setNewPin] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [isAuthenticatedToEdit, setIsAuthenticatedToEdit] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const biometricsAvailable = await AuthService.hasBiometrics();
    setHasBiometrics(biometricsAvailable);

    const savedSettings = await AuthService.getLockSettings();
    if (savedSettings) {
      setSettings(savedSettings);
    } else {
      setIsAuthenticatedToEdit(true); // No settings yet, can edit freely
    }
  };

  const authenticateToEdit = async () => {
    let success = false;
    if (settings.method === 'biometrics') {
      success = await AuthService.authenticateBiometrics('Authenticate to change settings');
    } else {
      // In a real app, we'd prompt for the PIN via a modal here.
      // For simplicity, assuming a prompt or returning true if they enter it
      Alert.prompt('Enter Current PIN', '', async (pin) => {
        const verified = await AuthService.verifyPin(pin);
        if (verified) {
          setIsAuthenticatedToEdit(true);
        } else {
          Alert.alert('Error', 'Incorrect PIN');
        }
      });
      return;
    }

    if (success) {
      setIsAuthenticatedToEdit(true);
    }
  };

  const handleSave = async () => {
    if (settings.method === 'pin' && newPin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return;
    }

    if (settings.method === 'pin' && newPin) {
      await AuthService.setPin(newPin);
    }

    await AuthService.saveLockSettings(settings);
    Alert.alert('Success', 'Lock settings saved!');
    setNewPin('');
  };

  if (settings.enabled && !isAuthenticatedToEdit) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Note Lock Settings</Text>
        <Button title="Authenticate to Edit Settings" onPress={authenticateToEdit} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Note Lock Settings</Text>
      
      <View style={styles.row}>
        <Text>Enable Note Locking</Text>
        <Switch
          value={settings.enabled}
          onValueChange={(val) => setSettings({ ...settings, enabled: val })}
        />
      </View>

      {settings.enabled && (
        <>
          <View style={styles.row}>
            <Text>Authentication Method</Text>
            <View style={styles.buttonGroup}>
              {hasBiometrics && (
                <Button 
                  title="Biometrics" 
                  color={settings.method === 'biometrics' ? 'blue' : 'gray'}
                  onPress={() => setSettings({ ...settings, method: 'biometrics' })} 
                />
              )}
              <Button 
                title="PIN" 
                color={settings.method === 'pin' ? 'blue' : 'gray'}
                onPress={() => setSettings({ ...settings, method: 'pin' })} 
              />
            </View>
          </View>

          {settings.method === 'pin' && (
            <TextInput
              style={styles.input}
              placeholder="Set New PIN"
              secureTextEntry
              keyboardType="numeric"
              value={newPin}
              onChangeText={setNewPin}
            />
          )}

          <View style={styles.row}>
            <Text>Timeout (Minutes)</Text>
            <TextInput
              style={[styles.input, { width: 60, marginBottom: 0 }]}
              keyboardType="numeric"
              value={settings.timeoutMinutes.toString()}
              onChangeText={(val) => setSettings({ ...settings, timeoutMinutes: parseInt(val) || 0 })}
            />
          </View>
        </>
      )}

      <View style={{ marginTop: 20 }}>
        <Button title="Save Settings" onPress={handleSave} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
});
