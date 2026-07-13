export type LockState = 'locked' | 'unlocked' | 'locking' | 'unlocking';

export type AuthMethod = 'biometric' | 'pin' | 'biometric_or_pin' | 'none';

export interface SecureNote {
  id: string;
  title: string;
  content: string;
  isLocked: boolean;
  lockedAt?: number;
  lockMethod?: AuthMethod;
}

export interface BiometricStatus {
  isAvailable: boolean;
  biometryType?: BiometricType;
  error?: string;
}

export type BiometricType = 'TouchID' | 'FaceID' | 'Fingerprint' | 'Iris' | null;

export interface LockConfig {
  authMethod: AuthMethod;
  timeoutMs: number;
  requireAuthOnRestart: boolean;
  maxPinAttempts: number;
  lockoutDurationMs: number;
  allowBiometricFallback: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  method: AuthMethod;
  attemptsRemaining?: number;
}

export interface LockEvent {
  noteId: string;
  type: 'locked' | 'unlocked' | 'auth_failed' | 'auth_success';
  timestamp: number;
  method?: AuthMethod;
}

export const DEFAULT_LOCK_CONFIG: LockConfig = {
  authMethod: 'biometric_or_pin',
  timeoutMs: 5 * 60 * 1000,
  requireAuthOnRestart: true,
  maxPinAttempts: 5,
  lockoutDurationMs: 60 * 1000,
  allowBiometricFallback: true,
};
