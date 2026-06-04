import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AuthService } from '../services/AuthService';
import { LockSettings } from '../types';

export const useNoteLock = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [lastAuthTime, setLastAuthTime] = useState<number | null>(null);
  const [lockSettings, setLockSettings] = useState<LockSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await AuthService.getLockSettings();
    if (settings) {
      setLockSettings(settings);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [lastAuthTime, lockSettings]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      checkTimeout();
    }
  };

  const checkTimeout = useCallback(() => {
    if (!lockSettings || !lockSettings.enabled || !lastAuthTime) return;
    
    const now = Date.now();
    const timeoutMs = lockSettings.timeoutMinutes * 60 * 1000;
    
    if (now - lastAuthTime > timeoutMs) {
      setIsAuthenticated(false);
    }
  }, [lastAuthTime, lockSettings]);

  const authenticate = async (pin?: string): Promise<boolean> => {
    if (!lockSettings?.enabled) return true;

    let success = false;
    
    if (lockSettings.method === 'biometrics') {
      const hasBiometrics = await AuthService.hasBiometrics();
      if (hasBiometrics) {
        success = await AuthService.authenticateBiometrics();
      } else {
        // Fallback to PIN if biometrics unavailable but method was set to biometrics
        if (pin) {
          success = await AuthService.verifyPin(pin);
        }
      }
    } else if (lockSettings.method === 'pin' && pin) {
      success = await AuthService.verifyPin(pin);
    }

    if (success) {
      setIsAuthenticated(true);
      setLastAuthTime(Date.now());
    }

    return success;
  };

  const lockNote = () => {
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    authenticate,
    lockNote,
    lockSettings,
    loadSettings,
  };
};
