import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

interface NoteLock {
  id: string;
  isLocked: boolean;
  lockedAt: Date | null;
  lockType: 'biometric' | 'pin' | 'password' | null;
  biometricType: string | null;
  pin: string | null;
  password: string | null;
}

class NoteLockService {
  private static instance: NoteLockService;
  private storageKey = 'warpspeed_note_locks';

  private constructor() {}

  static getInstance(): NoteLockService {
    if (!NoteLockService.instance) {
      this.instance = new NoteLockService();
    }
    return this.instance;
  }

  async lockNote(noteId: string, lockType: 'biometric' | 'pin' | 'password'): Promise<boolean> {
    try {
      // Store the lock configuration for this note
      const noteLock: NoteLock = {
        id: noteId,
        isLocked: true,
        lockedAt: new Date(),
        lockType: lockType,
        biometricType: null,
        pin: null,
        password: null
      };

      await this.saveNoteLock(noteId, noteLock);
      return true;
    } catch (error) {
      return false;
    }
  }

  async unlockNote(noteId: string): Promise<boolean> {
    try {
      const lockData = await this.getNoteLock(noteId);
      if (lockData && lockData.isLocked) {
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async isNoteLocked(noteId: string): Promise<boolean> {
    try {
      const lockData = await this.getNoteLock(noteId);
      return lockData ? lockData.isLocked : false;
    } catch (error) {
      return false;
    }
  }

  async getNoteLock(noteId: string): Promise<NoteLock | null> {
    try {
      const stored = await AsyncStorage.getItem(`${this.storageKey}_${noteId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async saveNoteLock(noteId: string, lockData: NoteLock): Promise<void> {
    try {
      await AsyncStorage.setItem(`${this.storageKey}_${noteId}`, JSON.stringify(lockData));
    } catch (error) {
      throw error;
    }
  }

  async removeNoteLock(noteId: string): Promise<void> {
    await AsyncStorage.removeItem(`${this.storageKey}_${noteId}`);
  }

  async authenticateBiometric(noteId: string): Promise<boolean> {
    // This would integrate with react-native-biometrics or similar
    // For now, return a promise that resolves to true to simulate authentication
    return Promise.resolve(true);
  }

  async authenticatePIN(noteId: string, pin: string): Promise<boolean> {
    // Validate PIN input against stored PIN
    const noteLock = await this.getNoteLock(noteId);
    if (note0tLock && noteLock.pin === pin) {
      return true;
    }
    return false;
  }

  async setPIN(noteId: string, pin: string): Promise<void> {
    const noteLock = await this.getNoteLock(noteId);
    if (noteLock) {
      noteLock.pin = pin;
      await this.saveNoteLock(noteId, noteLock);
    }
  }
}

export default NoteLockService;