import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BiometryType {
  available: boolean;
  biometryType: string;
}

class AuthenticationService {
  private static instance: AuthenticationService;
  private biometryAvailable: boolean = false;
  private biometryType: string = '';

  private constructor() {
    this.initializeBiometry();
  }

  static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  private async initializeBiometry() {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // In a real implementation, this would use a library like react-native-biometrics
        // For now, we'll simulate the availability
        this.biometryAvailable = true;
        this.biometryType = Platform.OS === 'ios' ? 'FaceID' : 'Biometrics';
      }
    } catch (error) {
      console.log('Biometry initialization error:', error);
      this.biometryAvailable = false;
    }
  }

  async authenticate(message: string = 'Authenticate to access locked notes'): Promise<boolean> {
    try {
      // This would integrate with react-native-biometrics or similar
      // For simulation purposes, we'll return true
      console.log('Authentication requested:', message);
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  async authenticateWithPIN(): Promise<boolean> {
    // In a real implementation, this would show a PIN input dialog
    // For simulation, we'll return true
    return true;
  }

  async isBiometryAvailable(): Promise<boolean> {
    return this.biometryAvailable;
  }

  getBiometryType(): string {
    return this.biometryType;
  }

  async setNoteLock(noteId: string, lockType: 'biometric' | 'pin'): Promise<void> {
    try {
      const lockData = {
        lockType,
        lockedAt: new Date().toISOString(),
        lastUnlocked: null
      };
      await AsyncStorage.setItem(`note_lock_${noteId}`, JSON.stringify(lockData));
    } catch (error) {
      console.error('Failed to set note lock:', error);
      throw new Error('Failed to lock note');
    }
  }

  async removeNoteLock(noteId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`note_lock_${noteId}`);
    } catch (error) {
      console.error('Failed to remove note lock:', error);
      throw new Error('Failed to unlock note');
    }
  }

  async isNoteLocked(noteId: string): Promise<boolean> {
    try {
      const lockData = await AsyncStorage.getItem(`note_lock_${noteId}`);
      return lockData !== null;
    } catch (error) {
      console.error('Failed to check note lock status:', error);
      return false;
    }
  }

  async getNoteLockData(noteId: string): Promise<any> {
    try {
      const lockData = await AsyncStorage.getItem(`note_lock_${noteId}`);
      return lockData ? JSON.parse(lockData) : null;
    } catch (error) {
      console.error('Failed to get note lock data:', error);
      return null;
    }
  }

  async unlockNote(noteId: string): Promise<boolean> {
    try {
      const lockData = await this.getNoteLockData(noteId);
      if (!lockData) return false;

      let authenticated = false;
      if (lockData.lockType === 'biometric') {
        authenticated = await this.authenticate('Authenticate to unlock this note');
      } else if (lockData.lockType === 'pin') {
        authenticated = await this.authenticateWithPIN();
      }

      if (authenticated) {
        const updatedLockData = {
          ...lockData,
          lastUnlocked: new Date().toISOString()
        };
        await AsyncStorage.setItem(`note_lock_${noteId}`, JSON.stringify(updatedLockData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unlock note:', error);
      return false;
    }
  }

  async shouldReauthenticate(noteId: string, timeoutMinutes: number = 5): Promise<boolean> {
    try {
      const lockData = await this.getNoteLockData(noteId);
      if (!lockData || !lockData.lastUnlocked) return true;

      const lastUnlocked = new Date(lockData.lastUnlocked);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastUnlocked.getTime()) / (1000 * 60);

      return diffMinutes > timeoutMinutes;
    } catch (error) {
      console.error('Failed to check reauthentication requirement:', error);
      return true;
    }
  }
}

export default AuthenticationService.getInstance();