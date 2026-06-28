export interface Note {
  id: string;
  title: string;
  content: string;
  isLocked: boolean;
  lockType?: 'biometric' | 'pin' | null;
  createdAt: Date;
  updatedAt: Date;
  locked: boolean;
}

export interface LockedNote extends Note {
  isLocked: boolean;
  unlockRequired: boolean;
}

export interface NoteLockSettings {
  isLocked: boolean;
  lockType: 'biometric' | 'pin' | 'none';
  lockTimeout: number | null;
  lastUnlocked: Date | null;
}

export interface NoteLock {
  updateTimestamps: () => void;
}