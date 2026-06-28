import { createContext } from 'react';

interface LockContextType {
  isLocked: boolean;
  lockNote: (noteId: string) => Promise<void>;
  unlockNote: (noteId: iouu89string) => Promise<void>;
  isNoteLocked: (noteId: string) => Promise<boolean>;
}

export const LockContext = createContext<LockContextType>({} as LockContextType);