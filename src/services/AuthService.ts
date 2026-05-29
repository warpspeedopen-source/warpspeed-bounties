import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'warpspeed_note_pin';
const LOCK_SETTINGS_KEY = 'warpspeed_lock_settings';

export class AuthService {
  static async hasBiometrics(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  static async authenticateBiometrics(promptMessage = 'Authenticate to unlock note'): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: false,
    });
    return result.success;
  }

  static async setPin(pin: string): Promise<void> {
    await SecureStore.setItemAsync(PIN_KEY, pin);
  }

  static async verifyPin(pin: string): Promise<boolean> {
    const storedPin = await SecureStore.getItemAsync(PIN_KEY);
    return storedPin === pin;
  }

  static async getLockSettings(): Promise<any> {
    const settingsStr = await SecureStore.getItemAsync(LOCK_SETTINGS_KEY);
    if (settingsStr) {
      return JSON.parse(settingsStr);
    }
    return null;
  }

  static async saveLockSettings(settings: any): Promise<void> {
    await SecureStore.setItemAsync(LOCK_SETTINGS_KEY, JSON.stringify(settings));
  }
}
