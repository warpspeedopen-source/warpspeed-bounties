// src/features/notes/hooks/useNoteSecurity.ts

import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import create from 'zustand';

// --- Configuration ---
const DEFAULT_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// --- Types ---
export interface Note {
  id: string;
  content: string;
  isLocked: boolean;
  // ... other note properties
}

interface NoteSecurityState {
  isUnlocked: boolean;
  isBiometricsAvailable: boolean;
  biometryType: BiometryTypes | null;
  lockTimeout: number;
  lastUnlockedTimestamp: number | null;
  initialize: () => Promise<void>;
  authenticate: (promptMessage?: string) => Promise<boolean>;
  lock: () => void;
  setLockTimeout: (timeout: number) => void;
}

// --- Zustand Store for Global State Management ---
// This store holds the global lock state of the app's "vault".
// This prevents needing to re-authenticate for every single locked note within a session.
const useNoteSecurityStore = create<NoteSecurityState>((set, get) => ({
  isUnlocked: false,
  isBiometricsAvailable: false,
  biometryType: null,
  lockTimeout: DEFAULT_LOCK_TIMEOUT_MS,
  lastUnlockedTimestamp: null,

  // 1. Initialize and check for hardware support
  initialize: async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      set({ isBiometricsAvailable: available, biometryType });
    } catch (error) {
      console.error('Biometrics initialization failed:', error);
      set({ isBiometricsAvailable: false, biometryType: null });
    }
  },

  // 2. Core authentication logic
  authenticate: async (promptMessage = 'Unlock to access your notes') => {
    const { isUnlocked, lastUnlockedTimestamp, lockTimeout, isBiometricsAvailable } = get();

    // If already unlocked and within the timeout window, grant access immediately.
    if (isUnlocked && lastUnlockedTimestamp && Date.now() - lastUnlockedTimestamp < lockTimeout) {
      set({ lastUnlockedTimestamp: Date.now() }); // Refresh timestamp on activity
      return true;
    }

    if (!isBiometricsAvailable) {
      // FALLBACK: Implement custom PIN or other method here if biometrics are not available.
      // For now, we deny access. A real implementation would show a PIN entry screen.
      console.warn('Biometrics not available. PIN fallback not implemented.');
      return false;
    }

    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage,
        // This allows fallback to device PIN/password, fulfilling a key requirement.
        cancelButtonText: 'Cancel',
      });

      if (success) {
        set({ isUnlocked: true, lastUnlockedTimestamp: Date.now() });
        return true;
      } else {
        set({ isUnlocked: false });
        return false;
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      set({ isUnlocked: false });
      return false;
    }
  },

  // 3. Explicitly lock the vault
  lock: () => {
    set({ isUnlocked: false, lastUnlockedTimestamp: null });
  },

  // 4. Allow user to configure the timeout
  setLockTimeout: (timeout: number) => {
    set({ lockTimeout: timeout });
  },
}));


// --- Main Custom Hook ---
// This hook provides the state and functions to the UI components.
// It also handles the app state changes (background/foreground) to enforce the lock timeout.
export const useNoteSecurity = () => {
  const state = useNoteSecurityStore();
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    // Initialize on mount
    state.initialize();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // If app comes to the foreground, check if it needs to be locked.
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        const { isUnlocked, lastUnlockedTimestamp, lockTimeout } = useNoteSecurityStore.getState();
        if (isUnlocked && lastUnlockedTimestamp && Date.now() - lastUnlockedTimestamp > lockTimeout) {
          state.lock();
        }
      }
      setAppState(nextAppState);
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [appState, state]);

  return state;
};

/*
 * --- HOW TO INTEGRATE THIS HOOK ---
 *
 * This hook is the central piece of logic. Here is how you would use it throughout the app.
 *
 * ============================================
 * 1. At the App's Root (e.g., App.tsx or Navigation Container)
 * ============================================
 *
 * You need a component that overlays the entire app when it's locked.
 *
 *  const AppNavigator = () => {
 *    const { authenticate } = useNoteSecurity();
 *    const [isAppVisible, setIsAppVisible] = useState(false);
 *
 *    useEffect(() => {
 *      // On app start, we need to authenticate if the feature is used.
 *      // A simple approach is to always require auth on fresh start.
 *      const checkAuth = async () => {
 *         const success = await authenticate('Unlock warpSpeed Notes');
 *         if (success) {
 *            setIsAppVisible(true);
 *         } else {
 *            // Handle failed initial auth (e.g., exit app, show error)
 *            BackHandler.exitApp();
 *         }
 *      };
 *      checkAuth();
 *    }, [authenticate]);
 *
 *    if (!isAppVisible) {
 *       return <SplashScreen />; // Or a loading indicator
 *    }
 *
 *    return (
 *      <NavigationContainer>
 *         // ... your navigators
 *      </NavigationContainer>
 *    );
 *  }
 *
 * ============================================
 * 2. In the Note List Screen (NoteList.tsx)
 * ============================================
 *
 * Display a lock icon on locked notes.
 *
 * const NoteListItem = ({ note }: { note: Note }) => (
 *   <TouchableOpacity onPress={() => navigateToNote(note)}>
 *      <Text>{note.title}</Text>
 *      {note.isLocked && <Icon name=\"lock\" />}
 *   </TouchableOpacity>
 * );
 *
 * ============================================
 * 3. In the Note Detail/Editor Screen (NoteEditor.tsx)
 * ============================================
 *
 * Before showing the note content, check if it's locked and if the app is unlocked.
 *
 * const NoteEditorScreen = ({ route }) => {
 *    const { noteId } = route.params;
 *    const note = useStore(state => state.notes.find(n => n.id === noteId));
 *    const { isUnlocked, authenticate } = useNoteSecurity();
 *    const [contentVisible, setContentVisible] = useState(false);
 *
 *    useEffect(() => {
 *      const showContent = async () => {
 *        if (!note.isLocked) {
 *          setContentVisible(true);
 *          return;
 *        }
 *
 *        // If the note is locked, we must be authenticated.
 *        if (isUnlocked) {
 *          setContentVisible(true);
 *        } else {
 *          const success = await authenticate(`Unlock to view this note`);
 *          setContentVisible(success);
 *        }
 *      };
 *
 *      showContent();
 *    }, [note, isUnlocked, authenticate]);
 *
 *    if (!contentVisible) {
 *      return <LockedNotePlaceholder onUnlockRequest={authenticate} />;
 *    }
 *
 *    return <TextInput value={note.content} ... />;
 * }
 *
 *
 * ============================================
 * 4. In Note Settings (to lock/unlock a note)
 * ============================================
 *
 * When the user presses the "Lock Note" button.
 *
 * const NoteSettings = ({ note, updateNote }) => {
 *    const { authenticate } = useNoteSecurity();
 *
 *    const handleLockToggle = async () => {
 *      // Always require authentication to change the lock status for security.
 *      const prompt = note.isLocked ? 'Authenticate to remove lock' : 'Authenticate to lock note';
 *      const success = await authenticate(prompt);
 *      if (success) {
 *        updateNote(note.id, { isLocked: !note.isLocked });
 *      }
 *    }
 *
 *    return <Button title={note.isLocked ? 'Unlock Note' : 'Lock Note'} onPress={handleLockToggle} />;
 * }
 *
 */