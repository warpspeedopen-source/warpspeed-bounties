// Note Locking Types and Implementation
export interface NoteLockConfig {
  isLocked: boolean;
  lockType: 'biometric' | 'pin' | 'none';
  pin?: string;
  biometricType?: 'Face ID' | 'Fingerprint' | 'PIN';
}

export interface LockedNote {
  id: string;
  title: string;
  content: string;
  isLocked: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  isLocked: boolean;
  lockConfig: NoteLockConfig;
}

export class NoteLockingService {
  private notes: Note[] = [];
  private lockedNotes: LockedNote[] = [];
  
  constructor() {
    this.loadNotes();
  }
}

export interface Note {
  id: string;
  title: string;
  content: string;
  isLocked: boolean;
  lockConfig: NoteLockConfig;
}
