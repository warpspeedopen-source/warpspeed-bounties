export type AuthMethod = 'biometrics' | 'pin';

export interface Note {
  id: string;
  title: string;
  content: string;
  isLocked: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LockSettings {
  enabled: boolean;
  method: AuthMethod;
  pin?: string;
  timeoutMinutes: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  lastAuthTime: number | null;
}
