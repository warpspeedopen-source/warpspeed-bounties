import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAudioRecording } from '../hooks/useAudioRecording';

export function AudioRecorder() {
  const { state, duration, start, stop, pause, resume } = useAudioRecording();
  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  
  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{formatTime(duration)}</Text>
      <Text style={styles.state}>{state}</Text>
      {state === 'idle' && <TouchableOpacity onPress={() => start()}><Text style={styles.btn}>🔴 Record</Text></TouchableOpacity>}
      {state === 'recording' && <TouchableOpacity onPress={stop}><Text style={styles.btn}>⏹ Stop</Text></TouchableOpacity>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  timer: { fontSize: 48, fontWeight: 'bold' },
  state: { fontSize: 16, color: '#666', marginBottom: 20 },
  btn: { fontSize: 24, padding: 10 },
});
