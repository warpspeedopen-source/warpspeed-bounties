export interface Note {
  id: string;
  title: string;
  content: string;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  metadata: Record<string, any>;
}

export interface LockedNote extends Note {
  locked: boolean;
  lockType: 'biometric' | 'pin';
  pin?: string;
}

export interface NoteLockStatus {
  noteId: string;
  isLocked: boolean;
  lockedAt: Date;
  lockType: 'biometric' | 'pin' | 'none';
}