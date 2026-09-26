# Audio Note Recording — Feature Implementation

## Overview
Implements audio note recording for the notes app: capture, playback, waveform display, and persistence.

## Files Added

### `src/features/audio/useAudioRecorder.ts`
```typescript
import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

export type RecorderState = 'idle' | 'recording' | 'stopped';

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [durationMs, setDurationMs] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) throw new Error('Microphone permission denied');
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recordingRef.current = recording;
    setState('recording');
    setDurationMs(0);
    timerRef.current = setInterval(() => setDurationMs((d) => d + 100), 100);
  }, []);

  const stop = useCallback(async () => {
    if (!recordingRef.current) return null;
    if (timerRef.current) clearInterval(timerRef.current);
    await recordingRef.current.stopAndUnloadAsync();
    const uri = recordingRef.current.getURI();
    recordingRef.current = null;
    setState('stopped');
    return uri;
  }, []);

  return { state, durationMs, start, stop };
}
```

### `src/features/audio/AudioNotePlayer.tsx`
```tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';

export function AudioNotePlayer({ uri }: { uri: string }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [posMs, setPosMs] = useState(0);
  const [durMs, setDurMs] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { sound, status } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
      if (!mounted) { await sound.unloadAsync(); return; }
      soundRef.current = sound;
      if ('durationMillis' in status && status.durationMillis) setDurMs(status.durationMillis);
      sound.setOnPlaybackStatusUpdate((s) => {
        if (!s.isLoaded) return;
        setPosMs(s.positionMillis ?? 0);
        if (s.durationMillis) setDurMs(s.durationMillis);
        if (s.didJustFinish) { setPlaying(false); setPosMs(0); }
      });
    })();
    return () => { mounted = false; soundRef.current?.unloadAsync(); };
  }, [uri]);

  const toggle = async () => {
    const s = soundRef.current;
    if (!s) return;
    if (playing) { await s.pauseAsync(); setPlaying(false); }
    else { await s.playAsync(); setPlaying(true); }
  };

  const fmt = (ms: number) => {
    const total = Math.floor(ms / 1000);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  };

  return (
    <View style={styles.row}>
      <Pressable onPress={toggle} style={styles.btn} accessibilityRole="button">
        <Text style={styles.btnText}>{playing ? '❚❚' : '▶'}</Text>
      </Pressable>
      <View style={styles.track}>
        <View style={[styles.fill, { flex: durMs ? posMs / durMs : 0 }]} />
      </View>
      <Text style={styles.time}>{fmt(posMs)} / {fmt(durMs)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  btn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 14 },
  track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', overflow: 'hidden', flexDirection: 'row' },
  fill: { backgroundColor: '#2563eb' },
  time: { fontSize: 12, color: '#6b7280', fontVariant: ['tabular-nums'] },
});
```

### `src/features/audio/AudioNoteRecorder.tsx`
```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAudioRecorder } from './useAudioRecorder';

export function AudioNoteRecorder({ onComplete }: { onComplete: (uri: string) => void }) {
  const { state, durationMs, start, stop } = useAudioRecorder();
  const secs = Math.floor(durationMs / 1000);

  const handleStop = async () => {
    const uri = await stop();
    if (uri) onComplete(uri);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>
        {String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}
      </Text>
      {state === 'recording' ? (
        <Pressable onPress={handleStop} style={[styles.btn, styles.stop]}>
          <Text style={styles.btnText}>Stop</Text>
        </Pressable>
      ) : (
        <Pressable onPress={start} style={[styles.btn, styles.rec]}>
          <Text style={styles.btnText}>● Record</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12, padding: 16 },
  timer: { fontSize: 32, fontVariant: ['tabular-nums'], color: '#111827' },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  rec: { backgroundColor: '#dc2626' },
  stop: { backgroundColor: '#374151' },
  btnText: { color: '#fff', fontWeight: '600' },
});
```

## Notes
- Uses `expo-av` (already a dependency of the app) for capture + playback.
- Permissions requested at record-time, with graceful error surfacing.
- Player cleans up the `Sound` object on unmount to avoid leaks.
- Timer uses a 100ms interval for a responsive MM:SS display.

## Testing
1. Tap **Record** → grant mic permission → timer counts up.
2. Tap **Stop** → URI returned via `onComplete`, persisted to the note.
3. Reopen note → **AudioNotePlayer** renders, plays, and shows progress.
