import { NativeModules, Platform } from 'react-native';

export class LockManager {
  static async requestLock(notes: string[]): Promise<void> {
    // Request system-level authentication
    try {
      const { success } = await NativeModules.LocalAuthentication.authenticateAsync({
        reason: 'Authenticate to lock note',
      });
      
      if (success) {
        // Lock the notes
        console.log('Authentication successful');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Lock authentication error:', error);
      throw error;
    }
  }

  static async verifyLock(notes: string[]): Promise<boolean> {
    const result = await NativeModules.LocalAuthentication.authenticateAsync({
      reason: 'Verify authentication to lock note',
    });
    return result.success;
  }
}