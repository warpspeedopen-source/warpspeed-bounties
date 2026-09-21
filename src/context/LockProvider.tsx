import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setSecureItem, getSecureItem, deleteSecureItem } from '../utils/secureStorage';
import { LockContextProps } from '../types';
import CryptoJS from 'crypto-js';

const LOCKED_NOTES_KEY = '@locked_notes';
const LAST_AUTH_KEY = '@last_auth';
const PIN_HASH_KEY = '@pin_hash';

// default timeout (ms) – can be overridden via env or settings later
const AUTH_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const LockContext = createContext<LockContextProps | undefined>(undefined);

export const LockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lockedNotes, setLockedNotes] = useState<Record<string, boolean>>({});
  const [lastAuth, setLastAuth] = useState<number | null>(null);

  // Load persisted locked notes & last auth timestamp on mount
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(LOCKED_NOTES_KEY);
      if (stored) setLockedNotes(JSON.parse(stored));

      const ts = await AsyncStorage.getItem(LAST_AUTH_KEY);
      if (ts) setLastAuth(parseInt(ts, 10));
    })();
  }, []);

  // Persist locked notes whenever they change
  useEffect(() => {
    AsyncStorage.setItem(LOCKED_NOTES_KEY, JSON.stringify(lockedNotes));
  }, [lockedNotes]);

  // Persist last auth timestamp
  useEffect(() => {
    if (lastAuth !== null) {
      AsyncStorage.setItem(LAST_AUTH_KEY, lastAuth.toString());
    }
  }, [lastAuth]);

  const isLocked = (noteId: string) => !!lockedNotes[noteId];

  const lockNote = async (noteId: string) => {
    setLockedNotes(prev => ({ ...prev, [noteId]: true }));
  };

  const unlockNote = async (noteId: string) => {
    setLockedNotes(prev => {
      const { [noteId]: _, ...rest } = prev;
      return rest;
    });
  };

  const removeLock = async (noteId: string) => {
    await unlockNote(noteId);
  };

  const _hashPin = (pin: string) => CryptoJS.SHA256(pin).toString();

  const setPin = async (pin: string) => {
    const hash = _hashPin(pin);
    await setSecureItem(PIN_HASH_KEY, hash);
  };

  const verifyPin = async (pin: string) => {
    const storedHash = await getSecureItem(PIN_HASH_KEY);
    if (!storedHash) return false;
    return storedHash === _hashPin(pin);
  };

  /** Perform biometric auth; fallback to PIN if unavailable or failed */
  const authenticate = async (): Promise<boolean> => {
    // First, check timeout
    const now = Date.now();
    if (lastAuth && now - lastAuth < AUTH_TIMEOUT) {
      setLastAuth(now);
      return true;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access locked notes',
        fallbackLabel: 'Enter PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setLastAuth(now);
        return true;
      }
    }

    // Biometric not available or failed – ask for PIN
    // NOTE: UI for PIN entry lives in <LockScreen/> component; here we just return false
    return false;
  };

  const value: LockContextProps = {
    lockedNotes,
    lockNote,
    unlockNote,
    removeLock,
    isLocked,
    authenticate,
    setPin,
    verifyPin,
    lastAuth,
  };

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
};

export const useLock = (): LockContextProps => {
  const ctx = useContext(LockContext);
  if (!ctx) {
    throw new Error('useLock must be used within a LockProvider');
  }
  return ctx;
};
