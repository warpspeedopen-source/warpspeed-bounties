import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Audio, AVPlaybackStatus, InterruptionModeIOS } from 'expo-av';

import type { PlaybackState, PlaybackStatus } from '../types';

// ─── Constants ────────────────────────────────────────────────────────

const RATES = [0.5, 1, 1.5, 2] as const;

const formatTime = (ms: number): string => {
  if (!Number.isFinite(ms) || ms < 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// ─── Props ────────────────────────────────────────────────────────────

interface AudioPlayerProps {
  /** URL (remote or local) of the audio file to play */
  source: string;
  /** Callback when playback finishes naturally */
  onPlaybackComplete?: () => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Initial playback rate (0.5, 1, 1.5, 2) */
  initialRate?: number;
  /** Disable controls */
  disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  source,
  onPlaybackComplete,
  onError,
  initialRate = 1,
  disabled = false,
}) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const isLoadedRef = useRef(false);

  const [state, setState] = useState<PlaybackState>({
    status: 'idle',
    positionMs: 0,
    durationMs: 0,
    volume: 1,
    isMuted: false,
    rate: initialRate,
    error: null,
  });

  // ── Load sound ───────────────────────────────────────────────────

  const loadSound = useCallback(async () => {
    try {
      setState((s) => ({ ...s, status: 'loading', error: null }));

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: source },
        { shouldPlay: false, progressUpdateIntervalMillis: 250 },
        onPlaybackStatusUpdate,
      );
      soundRef.current = sound;
      isLoadedRef.current = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audio';
      setState((s) => ({ ...s, status: 'error', error: message }));
      onError?.(message);
    }
  }, [source, onError]);

  // ── Playback status update handler ───────────────────────────────

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        if (status.error) {
          setState((s) => ({
            ...s,
            status: 'error',
            error: status.error,
          }));
          onError?.(status.error);
        }
        return;
      }

      const playbackStatus: PlaybackState = {
        status: status.isPlaying
          ? 'playing'
          : status.didJustFinish
            ? 'finished'
            : status.isLoaded
              ? 'paused'
              : 'idle',
        positionMs: status.positionMillis ?? 0,
        durationMs: status.durationMillis ?? 0,
        volume: status.volume ?? 1,
        isMuted: status.isMuted ?? false,
        rate: status.rate ?? 1,
        error: null,
      };

      setState(playbackStatus);

      if (status.didJustFinish) {
        onPlaybackComplete?.();
      }
    },
    [onPlaybackComplete, onError],
  );

  // ── Load on mount / source change ────────────────────────────────

  useEffect(() => {
    loadSound();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
        isLoadedRef.current = false;
      }
    };
  }, [loadSound]);

  // ── Play / pause ─────────────────────────────────────────────────

  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current || !isLoadedRef.current) return;
    try {
      if (state.status === 'playing') {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Playback error';
      setState((s) => ({ ...s, status: 'error', error: message }));
      onError?.(message);
    }
  }, [state.status, onError]);

  // ── Seek ─────────────────────────────────────────────────────────

  const seek = useCallback(
    async (deltaMs: number) => {
      if (!soundRef.current || !isLoadedRef.current) return;
      const newPosition = clamp(
        state.positionMs + deltaMs,
        0,
        state.durationMs,
      );
      try {
        await soundRef.current.setPositionAsync(newPosition);
        setState((s) => ({ ...s, positionMs: newPosition }));
      } catch {
        // best-effort seek
      }
    },
    [state.positionMs, state.durationMs],
  );

  // ── Cycle playback rate ──────────────────────────────────────────

  const cycleRate = useCallback(async () => {
    if (!soundRef.current || !isLoadedRef.current) return;
    const currentIndex = RATES.indexOf(state.rate as (typeof RATES)[number]);
    const nextRate = RATES[(currentIndex + 1) % RATES.length];
    try {
      await soundRef.current.setRateAsync(nextRate, true);
      setState((s) => ({ ...s, rate: nextRate }));
    } catch {
      // best-effort rate change
    }
  }, [state.rate]);

  // ── Toggle mute ──────────────────────────────────────────────────

  const toggleMute = useCallback(async () => {
    if (!soundRef.current || !isLoadedRef.current) return;
    const nextMuted = !state.isMuted;
    try {
      await soundRef.current.setIsMutedAsync(nextMuted);
      setState((s) => ({ ...s, isMuted: nextMuted }));
    } catch {
      // best-effort mute
    }
  }, [state.isMuted]);

  // ── Error alert ──────────────────────────────────────────────────

  useEffect(() => {
    if (state.status === 'error' && state.error) {
      Alert.alert('Playback Error', state.error);
    }
  }, [state.status, state.error]);

  // ── Seek backward / forward ──────────────────────────────────────

  const isPlayable =
    state.status !== 'loading' &&
    state.status !== 'error' &&
    !disabled;

  return (
    <View style={styles.container}>
      {/* Waveform / progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: state.durationMs > 0
                  ? `${(state.positionMs / state.durationMs) * 100}%`
                  : '0%',
              },
            ]}
          />
        </View>
      </View>

      {/* Time labels */}
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(state.positionMs)}</Text>
        <Text style={styles.timeText}>{formatTime(state.durationMs)}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Seek backward 15s */}
        <Pressable
          style={styles.controlButton}
          onPress={() => seek(-15000)}
          disabled={!isPlayable}
          accessibilityRole="button"
          accessibilityLabel="Seek backward 15 seconds"
        >
          <Text style={styles.controlIcon}>↺15</Text>
        </Pressable>

        {/* Play / pause */}
        <Pressable
          style={[
            styles.playButton,
            !isPlayable && styles.controlDisabled,
          ]}
          onPress={togglePlayPause}
          disabled={!isPlayable}
          accessibilityRole="button"
          accessibilityLabel={state.status === 'playing' ? 'Pause' : 'Play'}
        >
          <Text style={styles.playIcon}>
            {state.status === 'loading' ? '⏳' : state.status === 'playing' ? '⏸' : '▶'}
          </Text>
        </Pressable>

        {/* Seek forward 15s */}
        <Pressable
          style={styles.controlButton}
          onPress={() => seek(15000)}
          disabled={!isPlayable}
          accessibilityRole="button"
          accessibilityLabel="Seek forward 15 seconds"
        >
          <Text style={styles.controlIcon}>15↻</Text>
        </Pressable>
      </View>

      {/* Secondary controls row */}
      <View style={styles.secondaryRow}>
        {/* Speed */}
        <Pressable
          style={styles.secondaryButton}
          onPress={cycleRate}
          disabled={!isPlayable}
          accessibilityRole="button"
          accessibilityLabel={`Speed ${state.rate}x`}
        >
          <Text style={styles.secondaryText}>{state.rate}x</Text>
        </Pressable>

        {/* Mute */}
        <Pressable
          style={styles.secondaryButton}
          onPress={toggleMute}
          disabled={!isPlayable}
          accessibilityRole="button"
          accessibilityLabel={state.isMuted ? 'Unmute' : 'Mute'}
        >
          <Text style={styles.secondaryText}>
            {state.isMuted ? '🔇' : '🔊'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingVertical: 12,
  },
  progressContainer: {
    height: 24,
    justifyContent: 'center',
  },
  progressTrack: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    height: '100%',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#6B7280',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 12,
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  controlButton: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  controlDisabled: {
    opacity: 0.4,
  },
  controlIcon: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  secondaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    height: 32,
    justifyContent: 'center',
    minWidth: 48,
    paddingHorizontal: 12,
  },
  secondaryText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
});
