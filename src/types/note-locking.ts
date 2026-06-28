export interface NoteLock {
  id: string;
  noteId: string;
  isLocked: boolean;
  lockType: 'biometric' | 'pin' | 'none';
  pin?: string;
  biometricEnabled: boolean;
  lockedAt: Date | null;
  timeout: number | null;
  timeoutEnabled: boolean;
}

export interface NoteLockSettings {
  lockType: 'biometric' | 'pin' | 'none';
  pinRequired: boolean;
  biometricEnabled: boolean;
  timeout: number;
  timeoutUnit: 'minutes' | 'hours' | 'days';
}

export interface BiometricAuthOptions {
  biometricType: 'face' | 'touch' | 'fingerprint' | 'none';
  biometricAvailable: boolean;
}

export interface PinAuthOptions {
  pinLength: number;
  allowBiometricFallback: boolean;
}