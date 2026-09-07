import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PIN_STORE_KEY_PREFIX = 'note_pin_';

export class NoteLockingService {
  /**
   * Check if the device has biometric hardware and is enrolled.
   */
  static async hasBiometrics(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  /**
   * Authenticate using Biometrics.
   */
  static async authenticateWithBiometrics(promptMessage: string = 'Authenticate to unlock note'): Promise<boolean> {
    const canAuthenticate = await this.hasBiometrics();
    if (!canAuthenticate) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: true,
    });

    return result.success;
  }

  /**
   * Set a custom PIN for a specific note.
   */
  static async setNotePin(noteId: string, pin: string): Promise<void> {
    await SecureStore.setItemAsync(`${PIN_STORE_KEY_PREFIX}${noteId}`, pin);
  }

  /**
   * Verify a PIN for a specific note.
   */
  static async verifyNotePin(noteId: string, pin: string): Promise<boolean> {
    const storedPin = await SecureStore.getItemAsync(`${PIN_STORE_KEY_PREFIX}${noteId}`);
    return storedPin === pin;
  }

  /**
   * Remove a PIN for a specific note.
   */
  static async removeNotePin(noteId: string): Promise<void> {
    await SecureStore.deleteItemAsync(`${PIN_STORE_KEY_PREFIX}${noteId}`);
  }

  /**
   * Check if a note has a lock configured.
   */
  static async isNoteLocked(noteId: string): Promise<boolean> {
    const storedPin = await SecureStore.getItemAsync(`${PIN_STORE_KEY_PREFIX}${noteId}`);
    return storedPin !== null;
  }
}
