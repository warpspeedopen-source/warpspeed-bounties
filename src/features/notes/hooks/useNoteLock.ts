import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_AUTH_KEY = '@warpSpeed_last_auth';

export const useNoteLock = (noteId: string, timeoutMinutes: number = 5) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const lastAuth = await AsyncStorage.getItem(`${LAST_AUTH_KEY}_${noteId}`);
      if (lastAuth) {
        const diff = Date.now() - parseInt(lastAuth, 10);
        if (diff < timeoutMinutes * 60 * 1000) {
          setIsUnlocked(true);
          return;
        }
      }
      setIsUnlocked(false);
    } catch (err) {
      setIsUnlocked(false);
    }
  }, [noteId, timeoutMinutes]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const authenticate = useCallback(async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        setError('Biometrics not available. Please use device PIN.');
        setIsAuthenticating(false);
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Note',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        await AsyncStorage.setItem(`${LAST_AUTH_KEY}_${noteId}`, Date.now().toString());
        setIsUnlocked(true);
        setIsAuthenticating(false);
        return true;
      } else {
        setError('Authentication failed');
        setIsAuthenticating(false);
        return false;
      }
    } catch (err) {
      setError('Authentication error');
      setIsAuthenticating(false);
      return false;
    }
  }, [noteId]);

  const lock = useCallback(async () => {
    await AsyncStorage.removeItem(`${LAST_AUTH_KEY}_${noteId}`);
    setIsUnlocked(false);
  }, [noteId]);

  return { isUnlocked, isAuthenticating, error, authenticate, lock };
};