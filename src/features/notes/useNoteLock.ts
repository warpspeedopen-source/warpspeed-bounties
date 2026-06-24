import { useState, useCallback } from 'react';

export interface NoteLockState {
  isLocked: boolean;
  lockType: 'biometric' | 'pin' | 'none';
  timeoutMinutes: number;
  lastUnlockedAt: number | null;
}

const DEFAULT_TIMEOUT = 5; // 5 minutes

export function useNoteLock(noteId: string) {
  const [lockState, setLockState] = useState<NoteLockState>({
    isLocked: false,
    lockType: 'none',
    timeoutMinutes: DEFAULT_TIMEOUT,
    lastUnlockedAt: null,
  });

  const lockNote = useCallback((type: 'biometric' | 'pin' = 'biometric') => {
    setLockState(prev => ({
      ...prev,
      isLocked: true,
      lockType: type,
    }));
  }, []);

  const unlockNote = useCallback(() => {
    setLockState(prev => ({
      ...prev,
      isLocked: false,
      lastUnlockedAt: Date.now(),
    }));
  }, []);

  const isSessionExpired = useCallback(() => {
    if (!lockState.lastUnlockedAt || !lockState.isLocked) return true;
    const elapsed = (Date.now() - lockState.lastUnlockedAt) / 60000;
    return elapsed >= lockState.timeoutMinutes;
  }, [lockState]);

  const removeLock = useCallback(() => {
    setLockState({
      isLocked: false,
      lockType: 'none',
      timeoutMinutes: DEFAULT_TIMEOUT,
      lastUnlockedAt: null,
    });
  }, []);

  return { lockState, lockNote, unlockNote, isSessionExpired, removeLock };
}
