# Warpspeed Bounty #7 — Note Locking with Biometrics / PIN

**Bounty: $660** — Lock notes with Face ID, Touch ID, or PIN.

## Features

- 🔒 **Lock / unlock individual notes** via lock toggle button
- 👤 **Face ID / Touch ID** authentication using `expo-local-authentication`
- 🔢 **4-digit PIN** with confirmation, change flow, and brute-force lockout
- 🔀 **Smart fallback** — biometrics first, PIN as backup
- 🕐 **Auto-lock after timeout** (configurable, default 5 min)
- 🔄 **Re-auth on app restart** — locks persist across sessions
- 🚫 **Content hidden until auth** — locked cards show blurred preview
- 🎨 **Clear locked-state UI** — lock icons, red accents, locked badge

## Project Structure

```
src/
├── types.ts                  # All TypeScript types & constants
├── state/
│   └── lockStore.ts          # MobX store — all lock state & logic
├── hooks/
│   └── useNoteLock.ts        # Custom hook — bridges store → components
└── components/
    ├── LockToggle.tsx         # Lock/unlock icon button
    ├── LockScreen.tsx         # Full-screen auth gate (modal)
    ├── LockedNoteCard.tsx     # Card showing locked state in list
    ├── BiometricAuth.tsx      # Face ID / Touch ID handler
    └── PINSetup.tsx           # PIN creation / change flow
```

## Getting Started

```bash
npm install mobx mobx-react-lite expo-local-authentication @expo/vector-icons
```

Wrap your app root with MobX provider (optional — the global `lockStore` singleton can be imported directly):

```tsx
import { lockStore } from './state/lockStore';
```

## Quick Usage

### Lock/Unlock a Note

```tsx
import { LockToggle } from './components/LockToggle';

<LockToggle noteId="note-1" />
```

### Show Lock Screen for Locked Notes

```tsx
import { LockScreen } from './components/LockScreen';

<LockScreen
  noteId="note-1"
  visible={isLocked}
  onUnlocked={() => setIsLocked(false)}
  onDismiss={() => navigation.goBack()}
/>
```

### Display Locked Note in List

```tsx
import { LockedNoteCard } from './components/LockedNoteCard';

<LockedNoteCard
  note={note}
  onPress={() => setShowLockScreen(true)}
/>
```

### Set Up / Change PIN

```tsx
import { PINSetup } from './components/PINSetup';

<PINSetup
  mode="create"           // or "change"
  onComplete={() => {}}
  onCancel={() => {}}
/>
```

### Biometric Auth Component

```tsx
import { BiometricAuth } from './components/BiometricAuth';

<BiometricAuth
  onAuthenticated={handleSuccess}
  onFallback={handleFallbackToPIN}
/>
```

### Using the Hook

```tsx
import { useNoteLock } from './hooks/useNoteLock';

function NoteDetail({ id }: { id: string }) {
  const {
    isLocked,
    lockState,
    lock,
    unlock,
    toggle,
    hasBiometrics,
    hasPIN,
    authenticateWithBiometrics,
    authenticateWithPIN,
  } = useNoteLock({ noteId: id });

  return (
    <View>
      <Text>Status: {lockState}</Text>
      <Button title={isLocked ? 'Unlock' : 'Lock'} onPress={toggle} />
    </View>
  );
}
```

## Configuration

Adjust global defaults via `lockStore.updateConfig()`:

```ts
lockStore.updateConfig({
  timeoutMs: 300000,          // 5 min auto-lock
  maxPinAttempts: 5,          // lockout after 5 failures
  lockoutDurationMs: 60000,   // 60 sec lockout
  authMethod: 'biometric_or_pin',
});
```

## Important Notes

- **PINs are hashed** using a non-cryptographic hash by default. Replace `hashPIN()` in `lockStore.ts` with `expo-crypto` SHA-256 for production use.
- **Biometric state** is checked once on mount. Call `checkBiometrics()` from the hook to re-check.
- **Persistence** is not automatic. Serialize `lockStore.toJSON()` to `expo-secure-store` and restore on launch via `lockStore.fromJSON()`.
- All components are wrapped with `observer()` from `mobx-react-lite` for reactive updates.
