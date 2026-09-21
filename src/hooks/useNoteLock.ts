import { useCallback } from 'react';
import { Note } from '../types';
import { useLock } from '../context/LockProvider';

/**
 * Hook exposing convenient helpers for a single note.
 */
export const useNoteLock = (note: Note) => {
  const {
    isLocked,
    lockNote,
    unlockNote,
    removeLock,
    authenticate,
    setPin,
    verifyPin,
  } = useLock();

  const locked = isLocked(note.id);

  const lock = useCallback(async () => {
    await lockNote(note.id);
  }, [note.id, lockNote]);

  const unlock = useCallback(async () => {
    const ok = await authenticate();
    if (ok) {
      await unlockNote(note.id);
    } else {
      // authentication failed – UI will handle feedback
    }
  }, [note.id, authenticate, unlockNote]);

  const remove = useCallback(async () => {
    const ok = await authenticate();
    if (ok) {
      await removeLock(note.id);
    }
  }, [note.id, authenticate, removeLock]);

  return { locked, lock, unlock, remove, setPin, verifyPin };
};
