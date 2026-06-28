export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isLocked: boolean;
  lockType?: 'biometric' | 'pin' | 'none';
  lock PIN?: string;
  lockedAt?: Date;
  unlockTimeout?: number; // in minutes
}

export interface LockedNote extends Note {
  isLocked: true;
  lockType: 'biometric' | 'pin';
}

export interface UnlockedNote extends Note {
  isLocked: false;
}