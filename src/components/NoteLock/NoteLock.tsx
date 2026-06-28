import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { NoteLockOverlay } from './NoteLockOverlay';
import { NoteLockSettings } from './NoteLockSettings';
import { SecureStorage } from '../../utils/SecureStorage';
import { useAuthTimeout } from '../../hooks/useAuthTimeout';

export type LockType = 'biometric' | 'pin' | 'device' | null;

export interface NoteLockConfig {
  isLocked: boolean;
  lockType: LockType;
  pinHash?: string;
  lastAuthenticatedAt?: number;
  timeoutMinutes: number;
}

interface NoteLockProps {
  noteId: string;
  children: React.ReactNode;
  onLockChange?: (config: NoteLockConfig) => void;
}

const DEFAULT_TIMEOUT_MINUTES = 5;

export const NoteLock: React.FC<NoteLockProps> = ({ noteId, children, onLockChange }) => {
  const [lockConfig, setLockConfig] = useState<NoteLockConfig | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadLockConfig = useCallback(async () => {
    try {
      const config = await SecureStorage.getItem<NoteLockConfig>(`note_lock_${noteId}`);
      if (config) {
        setLockConfig(config);
        setIsUnlocked(false);
      } else {
        setLockConfig(null);
        setIsUnlocked(true);
      }
    } catch (error) {
      console.error('Failed to load lock config:', error);
      setLockConfig(null);
      setIsUnlocked(true);
    } finally {
      setIsLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    loadLockConfig();
  }, [loadLockConfig]);

  const { checkTimeout } = useAuthTimeout(lockConfig?.timeoutMinutes || DEFAULT_TIMEOUT_MINUTES);

  useEffect(() => {
    if (lockConfig && checkTimeout(lockConfig.lastAuthenticatedAt)) {
      setIsUnlocked(false);
    }
  }, [lockConfig, checkTimeout]);

  const authenticateWithBiometric = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to unlock note',
        fallbackLabel: 'Use device PIN',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }, []);

  const authenticateWithPIN = useCallback(async (pin: string): Promise<boolean> => {
    if (!lockConfig?.pinHash) return false;
    const hashedPin = await SecureStorage.hashPin(pin);
    return hashedPin === lockConfig.pinHash;
  }, [lockConfig?.pinHash]);

  const handleUnlock = useCallback(async (pin?: string): Promise<boolean> => {
    if (!lockConfig) return true;

    let success = false;

    if (lockConfig.lockType === 'biometric' || lockConfig.lockType === 'device') {
      success = await authenticateWithBiometric();
    } else if (lockConfig.lockType === 'pin' && pin) {
      success = await authenticateWithPIN(pin);
    }

    if (success) {
      const updatedConfig = {
        ...lockConfig,
        lastAuthenticatedAt: Date.now(),
      };
      await SecureStorage.setItem(`note_lock_${noteId}`, updatedConfig);
      setLockConfig(updatedConfig);
      setIsUnlocked(true);
    }

    return success;
  }, [lockConfig, noteId, authenticateWithBiometric, authenticateWithPIN]);

  const handleLockChange = useCallback(async (newConfig: NoteLockConfig | null) => {
    if (newConfig) {
      await SecureStorage.setItem(`note_lock_${noteId}`, newConfig);
      setLockConfig(newConfig);
      setIsUnlocked(true);
    } else {
      await SecureStorage.removeItem(`note_lock_${noteId}`);
      setLockConfig(null);
      setIsUnlocked(true);
    }
    onLockChange?.(newConfig || { isLocked: false, lockType: null, timeoutMinutes: DEFAULT_TIMEOUT_MINUTES });
  }, [noteId, onLockChange]);

  if (isLoading) {
    return <View style={styles.container} />;
  }

  if (!isUnlocked && lockConfig?.isLocked) {
    return (
      <NoteLockOverlay
        lockType={lockConfig.lockType}
        onUnlock={handleUnlock}
        onOpenSettings={() => setShowSettings(true)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {children}
      {showSettings && (
        <NoteLockSettings
          currentConfig={lockConfig}
          onSave={handleLockChange}
          onClose={() => setShowSettings(false)}
          requireAuth={handleUnlock}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});