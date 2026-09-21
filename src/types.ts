/**
 * Types used across the note‑locking feature.
 */

export interface Note {
  id: string;
  title: string;
  content: string;
  // true if the note is locked
  locked?: boolean;
}

/**
 * Context shape for lock management.
 */
export interface LockContextProps {
  /** Map of noteId → locked state */
  lockedNotes: Record<string, boolean>;

  /** Lock a note (adds to lockedNotes) */
  lockNote: (noteId: string) => Promise<void>;

  /** Unlock a note after successful auth */
  unlockNote: (noteId: string) => Promise<void>;

  /** Remove lock from a note */
  removeLock: (noteId: string) => Promise<void>;

  /** Check if a note is locked */
  isLocked: (noteId: string) => boolean;

  /** Trigger authentication flow (biometric or PIN) */
  authenticate: () => Promise<boolean>;

  /** Set or change user defined PIN */
  setPin: (pin: string) => Promise<void>;

  /** Verify a PIN entered by the user */
  verifyPin: (pin: string) => Promise<boolean>;

  /** Timestamp of the last successful authentication */
  lastAuth: number | null;
}
