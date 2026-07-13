# Design: Note Locking with Biometrics / PIN

## Architecture Overview

The note-locking system uses a **centralized MobX store** (`LockStore`) that holds all lock-related state, with a **custom React hook** (`useNoteLock`) bridging the store to components. The auth layer supports **biometric** (Face ID / Touch ID) and **PIN** authentication, with configurable fallback priority.

```
┌─────────────────────────────────────────────────┐
│                   Components                     │
│  LockToggle  LockScreen  LockedNoteCard          │
│  BiometricAuth  PINSetup                         │
└──────────────────────┬──────────────────────────┘
                       │ useNoteLock()
┌──────────────────────▼──────────────────────────┐
│               useNoteLock hook                   │
│  - AppState listeners (foreground/background)    │
│  - Biometric availability check                  │
│  - Auth orchestration (biometric → PIN fallback) │
└──────────────────────┬──────────────────────────┘
                       │ reads / writes
┌──────────────────────▼──────────────────────────┐
│               LockStore (MobX)                   │
│  - Per-note LockState map                        │
│  - Global lock / unlock                          │
│  - PIN hashing & verification                    │
│  - Auto-lock timeout tracking                    │
│  - Biometric status                              │
│  - Serialization for persistence                 │
└─────────────────────────────────────────────────┘
```

## Component Tree

```
App
├── NoteList
│   ├── LockedNoteCard        ← shows locked preview
│   │   └── LockToggle        ← lock/unlock button
│   └── LockScreen            ← full-screen auth gate (modal)
│       ├── BiometricAuth     ← Face ID / Touch ID prompt
│       └── PIN entry         ← inline 4-digit keypad
└── Settings
    ├── BiometricAuth         ← toggle / status
    └── PINSetup              ← create or change PIN
```

## Data Flow

### Locking a Note
1. User taps `LockToggle` → `useNoteLock.toggle()` → `lockStore.lockNote(id)`
2. `LockState` → `'locked'`, `note.isLocked = true`
3. `LockedNoteCard` re-renders (via MobX observer) showing locked UI
4. `LockScreen` modal is presented when user tries to view the locked note

### Unlocking a Note
1. User taps locked note or unlock button → `useNoteLock.unlock()`
2. Hook checks `authMethod` priority (biometric → PIN fallback)
3. `BiometricAuth` component triggers `LocalAuthentication.authenticateAsync()`
4. If biometrics succeed → `lockStore.unlockNote(id)` → `LockState` → `'unlocked'`
5. If biometrics fail / fallback → PIN entry is shown
6. PIN is verified against stored hash → success unlocks, failure increments counter
7. On 5 consecutive failures → 60-second lockout

### Auto-Lock (Timeout + Restart)
- `lastUnlockTimestamp` is updated on every unlock
- `AppState` listener in `useNoteLock` detects foreground/background
- On foreground: `checkAutoLock()` computes elapsed time; if > `timeoutMs` (default 5 min), `lockAll()` is called
- On restart: config option `requireAuthOnRestart` ensures locked state is restored from persisted store

## Auth Method Priority

| `authMethod`         | Behavior                                              |
|----------------------|-------------------------------------------------------|
| `biometric`          | Biometric only; no PIN fallback                       |
| `pin`                | PIN only; no biometric fallback                        |
| `biometric_or_pin`   | Biometric first; fallback to PIN on cancel/failure    |
| `none`               | No authentication (dev/debug)                          |

## PIN Security

- PINs are stored as **non-reversible hashes** (`hashPIN` function — simple FNV-1a-like hash; replace with `expo-crypto` SHA-256 in production)
- Max **5 attempts** before **60-second lockout**
- PIN creation requires confirmation (enter → re-enter)
- PIN change requires old PIN verification

## State Machine (Per-Note)

```
         ┌──────────┐
         │  locked  │ ◄──── lockAll(), timeout, restart
         └────┬─────┘
              │ tap unlock
              ▼
         ┌──────────┐     auth success     ┌──────────┐
         │ unlocking│ ──────────────────►  │ unlocked │
         └──────────┘                      └────┬─────┘
                                                 │ tap lock
                                                 ▼
                                              ┌──────────┐
                                              │  locked   │
                                              └──────────┘
```

## Persistence

`lockStore.toJSON()` / `lockStore.fromJSON()` serializes:
- `authMethod`
- `_pinHash`
- `lockedNoteIds`
- `isGloballyLocked`
- `config`

This data should be stored in **expo-secure-store** (keychain) for encrypted persistence across app restarts.

## Dependencies

| Package                      | Purpose                          |
|------------------------------|----------------------------------|
| `mobx` / `mobx-react-lite`   | State management                 |
| `expo-local-authentication`  | Face ID / Touch ID API           |
| `@expo/vector-icons`         | Lock icons, biometric icons      |
| `expo-secure-store`          | Encrypted persistence (optional) |
| `expo-crypto`                | Secure PIN hashing (optional)    |
