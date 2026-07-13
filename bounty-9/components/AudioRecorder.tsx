import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  AppStateStatus,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Audio, AudioMode, InterruptionModeIOS } from 'expo-av';
import * as FileSystem from 'expo-file-system';

import type { AudioMimeType, RecordingState, RecordingStatus } from '../types';

// ─── Constants ────────────────────────────────────────────────────────

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.webm',
    outputFormat: Audio.AndroidOutputFormat.WEBM,
    audioEncoder: Audio.AndroidAudioEncoder.OPUS,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 16000,
  },
  ios: {
    extension: '.wav',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 16000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

const getMimeType = (): AudioMimeType =>
  Platform.OS === 'android' ? 'audio/webm' : 'audio/wav';

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// ─── Props ────────────────────────────────────────────────────────────

interface AudioRecorderProps {
  /** Called with local file URI after recording + stop */
  onRecordingComplete?: (uri: string, durationMs: number, mimeType: AudioMimeType) => void;
  /** Called on error */
  onError?: (error: string) => void;
  /** Maximum recording duration in ms (default 10 min) */
  maxDurationMs?: number;
  /** Disable the record button */
  disabled?: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────

const useAudioPermission = () => {
  const [permission, setPermission] = useState<RecordingStatus>('permission-pending');

  const requestPermission = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      setPermission(granted ? 'ready' : 'permission-denied');
      return granted;
    } catch {
      setPermission('permission-denied');
      return false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { granted } = await Audio.getPermissionsAsync();
      setPermission(granted ? 'ready' : 'permission-pending');
    })();
  }, []);

  return { permission, requestPermission };
};

// ─── Component ────────────────────────────────────────────────────────

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onError,
  maxDurationMs = 600_000,
  disabled = false,
}) => {
  const { permission, requestPermission } = useAudioPermission();
  const [state, setState] = useState<RecordingState>({
    status: permission === 'ready' ? 'ready' : 'idle',
    durationMs: 0,
    fileUri: null,
    fileSize: null,
    error: null,
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // ── Sync initial permission state ────────────────────────────────

  useEffect(() => {
    if (permission === 'ready' && state.status === 'idle') {
      setState((s) => ({ ...s, status: 'ready' }));
    }
    if (permission === 'permission-denied') {
      setState((s) => ({ ...s, status: 'permission-denied' }));
    }
  }, [permission, state.status]);

  // ── Handle app foregrounding → restart audio session ─────────────

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active' &&
        recordingRef.current
      ) {
        Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // ── Cleanup on unmount ───────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  // ── Duration timer ───────────────────────────────────────────────

  const startTimer = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setState((s) => ({ ...s, durationMs: elapsed }));
      if (elapsed >= maxDurationMs) {
        stopRecording();
      }
    }, 250);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ── Start recording ──────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    try {
      if (permission !== 'ready') {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            'Microphone Access Required',
            'Enable microphone access in Settings to record audio notes.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => {} },
            ],
          );
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      recordingRef.current = recording;
      setState({
        status: 'recording',
        durationMs: 0,
        fileUri: null,
        fileSize: null,
        error: null,
      });
      startTimer();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setState((s) => ({ ...s, status: 'error', error: message }));
      onError?.(message);
    }
  }, [permission, requestPermission, onError, maxDurationMs]);

  // ── Stop recording ───────────────────────────────────────────────

  const stopRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) return;

      stopTimer();
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('Recording URI is null after stop');
      }

      const info = await FileSystem.getInfoAsync(uri, { size: true });
      const durationMs = Date.now() - startTimeRef.current;

      setState({
        status: 'stopped',
        durationMs,
        fileUri: uri,
        fileSize: info.exists ? info.size ?? null : null,
        error: null,
      });

      onRecordingComplete?.(uri, durationMs, getMimeType());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop recording';
      setState((s) => ({ ...s, status: 'error', error: message }));
      onError?.(message);
    }
  }, [onRecordingComplete, onError]);

  // ── Discard local recording ──────────────────────────────────────

  const discardRecording = useCallback(async () => {
    if (state.fileUri) {
      try {
        await FileSystem.deleteAsync(state.fileUri, { idempotent: true });
      } catch { /* best-effort */ }
    }
    setState({
      status: 'ready',
      durationMs: 0,
      fileUri: null,
      fileSize: null,
      error: null,
    });
  }, [state.fileUri]);

  // ── Reset to record again ────────────────────────────────────────

  const resetRecording = useCallback(() => {
    setState({
      status: 'ready',
      durationMs: 0,
      fileUri: null,
      fileSize: null,
      error: null,
    });
  }, []);

  // ── Render helpers ───────────────────────────────────────────────

  const isRecording = state.status === 'recording';
  const isStopped = state.status === 'stopped';
  const isBusy = isRecording || state.status === 'uploading';
  const canRecord = !disabled && !isBusy && permission !== 'permission-denied';

  return (
    <View style={styles.container}>
      {/* Permission denied banner */}
      {permission === 'permission-denied' && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Microphone access denied. Enable it in Settings.
          </Text>
        </View>
      )}

      {/* Timer display */}
      <Text
        style={[
          styles.timer,
          isRecording && styles.timerActive,
        ]}
        accessibilityLabel={`Recording duration: ${formatTime(state.durationMs)}`}
      >
        {isStopped ? formatTime(state.durationMs) : formatTime(state.durationMs)}
      </Text>

      {/* Status label */}
      <Text style={styles.statusLabel}>
        {state.status === 'recording' && 'Recording…'}
        {state.status === 'uploading' && 'Uploading…'}
        {state.status === 'stopped' && 'Recording complete'}
        {state.status === 'error' && 'Error'}
        {state.status === 'ready' && 'Tap to record'}
        {state.status === 'idle' && 'Ready'}
      </Text>

      {/* Record / Stop button */}
      <Pressable
        style={({ pressed }) => [
          styles.recordButton,
          isRecording && styles.recordButtonActive,
          isStopped && styles.recordButtonStopped,
          !canRecord && styles.recordButtonDisabled,
          pressed && canRecord && styles.recordButtonPressed,
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={!canRecord || disabled}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
      >
        <View
          style={[
            styles.recordIcon,
            isRecording && styles.recordIconActive,
            isStopped && styles.recordIconStopped,
          ]}
        />
      </Pressable>

      {/* Action buttons (visible after stop) */}
      {isStopped && (
        <View style={styles.actions}>
          <Pressable
            style={styles.actionButton}
            onPress={discardRecording}
            accessibilityRole="button"
            accessibilityLabel="Discard recording"
          >
            <Text style={styles.actionButtonText}>Discard</Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={resetRecording}
            accessibilityRole="button"
            accessibilityLabel="Record new"
          >
            <Text style={styles.actionButtonText}>Record New</Text>
          </Pressable>
        </View>
      )}

      {/* Error display */}
      {state.status === 'error' && state.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{state.error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={resetRecording}
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────

const BUTTON_SIZE = 80;
const ICON_SIZE = 56;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  banner: {
    backgroundColor: '#FEF3CD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  bannerText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  timer: {
    color: '#1F2937',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 48,
    fontWeight: '200',
    letterSpacing: 2,
  },
  timerActive: {
    color: '#DC2626',
  },
  statusLabel: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: -4,
  },
  recordButton: {
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: BUTTON_SIZE / 2,
    height: BUTTON_SIZE,
    justifyContent: 'center',
    width: BUTTON_SIZE,
  },
  recordButtonActive: {
    backgroundColor: '#991B1B',
  },
  recordButtonStopped: {
    backgroundColor: '#10B981',
  },
  recordButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  recordButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  recordIcon: {
    backgroundColor: '#FFFFFF',
    borderRadius: ICON_SIZE / 2,
    height: ICON_SIZE,
    width: ICON_SIZE,
  },
  recordIconActive: {
    borderRadius: 8,
    height: 24,
    width: 24,
  },
  recordIconStopped: {
    borderRadius: ICON_SIZE / 2,
    height: ICON_SIZE,
    width: ICON_SIZE,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  actionButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  retryButtonText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
  },
});
