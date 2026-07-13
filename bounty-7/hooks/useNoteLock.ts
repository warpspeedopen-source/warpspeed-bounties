import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { lockStore } from '../state/lockStore';
import { LockState, AuthMethod, AuthResult } from '../types';

interface UseNoteLockOptions {
  noteId: string;
}

interface UseNoteLockReturn {
  isLocked: boolean;
  lockState: LockState;
  isGloballyLocked: boolean;
  hasBiometrics: boolean;
  hasPIN: boolean;
  lock: () => void;
  unlock: () => Promise<boolean>;
  toggle: () => Promise<void>;
  authenticate: (method?: AuthMethod) => Promise<AuthResult>;
  authenticateWithBiometrics: () => Promise<AuthResult>;
  authenticateWithPIN: (pin: string) => AuthResult;
  checkBiometrics: () => Promise<void>;
  resetLockState: () => void;
}

export function useNoteLock({ noteId }: UseNoteLockOptions): UseNoteLockReturn {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        lockStore.onAppForeground();
      }
      if (nextState.match(/inactive|background/)) {
        lockStore.onAppBackground();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  const checkBiometrics = useCallback(async () => {
    const [compatible, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    const isAvailable = compatible && enrolled;
    let biometryType: 'TouchID' | 'FaceID' | null = null;

    if (isAvailable) {
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometryType = 'FaceID';
      } else if (
        types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT) ||
        types.includes(LocalAuthentication.AuthenticationType.IRIS)
      ) {
        biometryType = 'TouchID';
      }
    }

    lockStore.setBiometricStatus({ isAvailable, biometryType });
  }, []);

  useEffect(() => {
    checkBiometrics();
  }, [checkBiometrics]);

  const authenticateWithBiometrics = useCallback(async (): Promise<AuthResult> => {
    if (!lockStore.hasBiometrics) {
      return { success: false, error: 'Biometrics not available', method: 'biometric' };
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Note',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true, method: 'biometric' };
      }

      if (result.error === 'user_cancel') {
        return { success: false, error: 'Cancelled', method: 'biometric' };
      }

      return { success: false, error: result.error ?? 'Authentication failed', method: 'biometric' };
    } catch {
      return { success: false, error: 'Biometric authentication error', method: 'biometric' };
    }
  }, []);

  const authenticateWithPIN = useCallback((pin: string): AuthResult => {
    return lockStore.authenticateWithPin(pin);
  }, []);

  const authenticate = useCallback(
    async (method?: AuthMethod): Promise<AuthResult> => {
      const authMethod = method ?? lockStore.authMethod;

      if (authMethod === 'biometric' || authMethod === 'biometric_or_pin') {
        if (lockStore.hasBiometrics) {
          const result = await authenticateWithBiometrics();
          if (result.success || authMethod === 'biometric') {
            return result;
          }
          if (authMethod === 'biometric_or_pin' && !result.success) {
            return { success: false, method: 'pin', error: 'PIN required' };
          }
        } else if (authMethod === 'biometric') {
          return { success: false, error: 'Biometrics not available', method: 'biometric' };
        }
      }

      if (authMethod === 'pin' || authMethod === 'biometric_or_pin') {
        if (!lockStore.hasPIN) {
          return { success: false, error: 'No PIN configured', method: 'pin' };
        }
        return { success: false, method: 'pin', error: 'PIN required' };
      }

      return { success: false, error: 'No authentication method configured', method: 'none' };
    },
    [authenticateWithBiometrics],
  );

  const unlock = useCallback(async (): Promise<boolean> => {
    if (!lockStore.isNoteLocked(noteId)) return true;

    lockStore.setNoteLockState(noteId, 'unlocking');

    const result = await authenticate();
    if (result.success) {
      lockStore.unlockNote(noteId);
      lockStore.unlockGlobally();
      return true;
    }

    lockStore.setNoteLockState(noteId, 'locked');

    if (result.error === 'PIN required') {
      return false;
    }

    return false;
  }, [noteId, authenticate]);

  const lock = useCallback(() => {
    lockStore.lockNote(noteId);
  }, [noteId]);

  const toggle = useCallback(async () => {
    if (lockStore.isNoteLocked(noteId)) {
      await unlock();
    } else {
      lock();
    }
  }, [noteId, unlock, lock]);

  const resetLockState = useCallback(() => {
    lockStore.setNoteLockState(noteId, 'locked');
  }, [noteId]);

  return {
    isLocked: lockStore.isNoteLocked(noteId),
    lockState: lockStore.getNoteLockState(noteId),
    isGloballyLocked: lockStore.isGloballyLocked,
    hasBiometrics: lockStore.hasBiometrics,
    hasPIN: lockStore.hasPIN,
    lock,
    unlock,
    toggle,
    authenticate,
    authenticateWithBiometrics,
    authenticateWithPIN,
    checkBiometrics,
    resetLockState,
  };
}
