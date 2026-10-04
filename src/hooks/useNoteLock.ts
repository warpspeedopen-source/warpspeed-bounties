<content>
import { useState, useEffect, useCallback } from 'react';
import { SecureStore } from 'expo-secure-store';
import { Platform } from 'react-native';
import { Note } from '../types/Note';

interface LockSettings {
  method: 'biometrics' | 'pin';
  timeout: number; // in minutes
  requiresAuthOnAppRestart: boolean;
}

const NOTE_LOCK_PREFIX = 'note_lock_';
const LOCK_SETTINGS_KEY = 'note_lock_settings';
const LAST_AUTH_KEY = 'last_auth_time';
const AUTH_TIMEOUT_KEY = 'auth_timeout';

export const useNoteLock = () => {
  const [lockSettings, setLockSettings] = useState<LockSettings>({
    method: 'biometrics',
    timeout: 15, // 15 minutes default
    requiresAuthOnAppRestart: true,
  });

  // Load lock settings from secure storage
  useEffect(() => {
    const loadLockSettings = async () => {
      try {
        const settings = await SecureStore.getItemAsync(LOCK_SETTINGS_KEY);
        if (settings) {
          setLockSettings(JSON.parse(settings));
        }
      } catch (error) {
        console.error('Failed to load lock settings:', error);
      }
    };

    loadLockSettings();
  }, []);

  // Save lock settings to secure storage
  const saveLockSettings = useCallback(async (settings: LockSettings) => {
    try {
      await SecureStore.setItemAsync(LOCK_SETTINGS_KEY, JSON.stringify(settings));
      setLockSettings(settings);
    } catch (error) {
      console.error('Failed to save lock settings:', error);
    }
  }, []);

  // Check if a note is locked
  const isLocked = useCallback((noteId: string): boolean => {
    try {
      const lockData = SecureStore.getItemSync(`${NOTE_LOCK_PREFIX}${noteId}`);
      return lockData !== null;
    } catch (error) {
      console.error('Failed to check note lock status:', error);
      return false;
    }
  }, []);

  // Lock a note
  const lockNote = useCallback(async (noteId: string, method: 'biometrics' | 'pin' = 'biometrics'): Promise<boolean> => {
    try {
      // Store lock information
      await SecureStore.setItemAsync(`${NOTE_LOCK_PREFIX}${noteId}`, JSON.stringify({
        lockedAt: new Date().toISOString(),
        method,
      }));

      // Update note in storage to mark as locked
      const noteData = await SecureStore.getItemAsync(`note_${noteId}`);
      if (noteData) {
        const note: Note = JSON.parse(noteData);
        note.isLocked = true;
        await SecureStore.setItemAsync(`note_${noteId}`, JSON.stringify(note));
      }

      return true;
    } catch (error) {
      console.error('Failed to lock note:', error);
      return false;
    }
  }, []);

  // Unlock a note
  const unlockNote = useCallback(async (noteId: string): Promise<boolean> => {
    try {
      // Remove lock information
      await SecureStore.deleteItemAsync(`${NOTE_LOCK_PREFIX}${noteId}`);

      // Update note in storage to mark as unlocked
      const noteData = await SecureStore.getItemAsync(`note_${noteId}`);
      if (noteData) {
        const note: Note = JSON.parse(noteData);
        note.isLocked = false;
        await SecureStore.setItemAsync(`note_${noteId}`, JSON.stringify(note));
      }

      // Update last auth time
      await SecureStore.setItemAsync(LAST_AUTH_KEY, new Date().toISOString());

      return true;
    } catch (error) {
      console.error('Failed to unlock note:', error);
      return false;
    }
  }, []);

  // Check if authentication is required
  const isAuthRequired = useCallback(async (): Promise<boolean> => {
    try {
      // Check if app restart authentication is required
      if (lockSettings.requiresAuthOnAppRestart) {
        const lastAuth = await SecureStore.getItemAsync(LAST_AUTH_KEY);
        if (!lastAuth) {
          return true; // Never authenticated before
        }
      }

      // Check if timeout-based authentication is required
      if (lockSettings.timeout > 0) {
        const lastAuth = await SecureStore.getItemAsync(LAST_AUTH_KEY);
        const authTimeout = await SecureStore.getItemAsync(AUTH_TIMEOUT_KEY);
        
        if (lastAuth && authTimeout) {
          const lastAuthTime = new Date(lastAuth).getTime();
          const now = new Date().getTime();
          const timeoutMs = lockSettings.timeout * 60 * 1000;
          
          // Check if we've exceeded the timeout
          if (now - lastAuthTime > timeoutMs) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to check authentication requirement:', error);
      return true; // Fail safe: require authentication if check fails
    }
  }, [lockSettings]);

  // Set authentication timeout
  const setAuthTimeout = useCallback(async (timeout: number): Promise<void> => {
    try {
      await SecureStore.setItemAsync(AUTH_TIMEOUT_KEY, timeout.toString());
    } catch (error) {
      console.error('Failed to set auth timeout:', error);
    }
  }, []);

  // Get lock settings for a specific note
  const getNoteLockSettings = useCallback(async (noteId: string): Promise<{ method: string; lockedAt: string } | null> => {
    try {
      const lockData = await SecureStore.getItemAsync(`${NOTE_LOCK_PREFIX}${noteId}`);
      return lockData ? JSON.parse(lockData) : null;
    } catch (error) {
      console.error('Failed to get note lock settings:', error);
      return null;
    }
  }, []);

  // Remove lock from a note
  const removeNoteLock = useCallback(async (noteId: string): Promise<boolean> => {
    try {
      await unlockNote(noteId);
      return true;
    } catch (error) {
      console.error('Failed to remove note lock:', error);
      return false;
    }
  }, [unlockNote]);

  return {
    lockSettings,
    saveLockSettings,
    isLocked,
    lockNote,
    unlockNote,
    isAuthRequired,
    setAuthTimeout,
    getNoteLockSettings,
    removeNoteLock,
  };
};
</content>