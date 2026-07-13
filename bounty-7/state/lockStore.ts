import { makeAutoObservable } from 'mobx';
import {
  LockState,
  AuthMethod,
  BiometricStatus,
  LockConfig,
  AuthResult,
  DEFAULT_LOCK_CONFIG,
} from '../types';

export class LockStore {
  private _noteLockStates: Map<string, LockState> = new Map();
  private _lockedNoteIdSet: Set<string> = new Set();
  private _pinHash: string | null = null;

  authMethod: AuthMethod = DEFAULT_LOCK_CONFIG.authMethod;
  biometricStatus: BiometricStatus = { isAvailable: false, biometryType: null };

  isGloballyLocked = true;
  lastUnlockTimestamp = 0;

  pinAttempts = 0;
  isLockedOut = false;
  lockoutUntil = 0;

  config: LockConfig = { ...DEFAULT_LOCK_CONFIG };

  constructor() {
    makeAutoObservable(this);
  }

  get hasBiometrics(): boolean {
    return this.biometricStatus.isAvailable;
  }

  get hasPIN(): boolean {
    return this._pinHash !== null;
  }

  get noteLockStates(): Record<string, LockState> {
    const obj: Record<string, LockState> = {};
    this._noteLockStates.forEach((v, k) => { obj[k] = v; });
    return obj;
  }

  get lockedNoteIds(): string[] {
    return Array.from(this._lockedNoteIdSet);
  }

  getNoteLockState(noteId: string): LockState {
    return this._noteLockStates.get(noteId) ?? 'locked';
  }

  setNoteLockState(noteId: string, state: LockState) {
    this._noteLockStates.set(noteId, state);
    if (state === 'locked' || state === 'locking') {
      this._lockedNoteIdSet.add(noteId);
    } else if (state === 'unlocked') {
      this._lockedNoteIdSet.delete(noteId);
    }
  }

  isNoteLocked(noteId: string): boolean {
    if (!this._noteLockStates.has(noteId)) return true;
    const state = this.getNoteLockState(noteId);
    return state === 'locked' || state === 'locking';
  }

  lockNote(noteId: string) {
    this.setNoteLockState(noteId, 'locked');
  }

  unlockNote(noteId: string) {
    this.setNoteLockState(noteId, 'unlocked');
    this.lastUnlockTimestamp = Date.now();
  }

  toggleNoteLock(noteId: string) {
    if (this.isNoteLocked(noteId)) {
      this.unlockNote(noteId);
    } else {
      this.lockNote(noteId);
    }
  }

  lockAll() {
    this._noteLockStates.forEach((_, noteId) => {
      this.setNoteLockState(noteId, 'locked');
    });
    this.isGloballyLocked = true;
  }

  unlockGlobally() {
    this.isGloballyLocked = false;
    this.lastUnlockTimestamp = Date.now();
  }

  checkAutoLock(): boolean {
    if (!this.isGloballyLocked) {
      const elapsed = Date.now() - this.lastUnlockTimestamp;
      if (elapsed >= this.config.timeoutMs) {
        this.lockAll();
        return true;
      }
    }
    return this.isGloballyLocked;
  }

  authenticateWithPin(pin: string): AuthResult {
    if (this.isLockedOut) {
      if (Date.now() < this.lockoutUntil) {
        const remaining = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
        return {
          success: false,
          error: `Too many attempts. Try again in ${remaining}s`,
          method: 'pin',
          attemptsRemaining: 0,
        };
      }
      this.isLockedOut = false;
      this.pinAttempts = 0;
    }

    if (!this._pinHash) {
      return { success: false, error: 'No PIN configured', method: 'pin' };
    }

    if (this._pinHash !== hashPIN(pin)) {
      this.pinAttempts++;
      if (this.pinAttempts >= this.config.maxPinAttempts) {
        this.isLockedOut = true;
        this.lockoutUntil = Date.now() + this.config.lockoutDurationMs;
        return {
          success: false,
          error: `Locked out for ${this.config.lockoutDurationMs / 1000}s`,
          method: 'pin',
          attemptsRemaining: 0,
        };
      }
      return {
        success: false,
        error: 'Incorrect PIN',
        method: 'pin',
        attemptsRemaining: this.config.maxPinAttempts - this.pinAttempts,
      };
    }

    this.pinAttempts = 0;
    return { success: true, method: 'pin' };
  }

  setPIN(pin: string) {
    this._pinHash = hashPIN(pin);
    this.pinAttempts = 0;
    this.isLockedOut = false;
  }

  verifyPIN(pin: string): boolean {
    return this._pinHash === hashPIN(pin);
  }

  removePIN() {
    this._pinHash = null;
    if (this.authMethod === 'pin') {
      this.authMethod = 'none';
    }
  }

  changePIN(oldPIN: string, newPIN: string): boolean {
    if (!this.verifyPIN(oldPIN)) return false;
    this.setPIN(newPIN);
    return true;
  }

  setBiometricStatus(status: BiometricStatus) {
    this.biometricStatus = status;
  }

  setAuthMethod(method: AuthMethod) {
    this.authMethod = method;
  }

  updateConfig(partial: Partial<LockConfig>) {
    Object.assign(this.config, partial);
  }

  onAppForeground() {
    this.checkAutoLock();
  }

  onAppBackground() {
    if (this.config.requireAuthOnRestart) {
      // On next foreground checkAutoLock will enforce timeout
    }
  }

  toJSON() {
    return {
      authMethod: this.authMethod,
      _pinHash: this._pinHash,
      lockedNoteIds: Array.from(this._lockedNoteIdSet),
      isGloballyLocked: this.isGloballyLocked,
      config: this.config,
    };
  }

  fromJSON(data: ReturnType<typeof this.toJSON>) {
    this.authMethod = data.authMethod;
    this._pinHash = data._pinHash;
    this._lockedNoteIdSet = new Set(data.lockedNoteIds);
    this.isGloballyLocked = data.isGloballyLocked;
    this.config = data.config;
    for (const noteId of data.lockedNoteIds) {
      this._noteLockStates.set(noteId, 'locked');
    }
  }
}

function hashPIN(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `pin_${Math.abs(hash).toString(36)}`;
}

const lockStore = new LockStore();
export { lockStore };
export default lockStore;
