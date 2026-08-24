import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { audioService } from '../services/AudioService';

interface AudioRecorderProps {
  onSave: (uri: string) => void;
  onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSave, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      pulseAnim.stopAnimation();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const handleStart = async () => {
    const permitted = await audioService.requestPermissions();
    if (!permitted) return;
    await audioService.startRecording();
    setIsRecording(true);
  };

  const handlePause = async () => {
    await audioService.pauseRecording();
    setIsPaused(true);
  };

  const handleResume = async () => {
    await audioService.resumeRecording();
    setIsPaused(false);
  };

  const handleStop = async () => {
    const uri = await audioService.stopRecording();
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    if (uri) onSave(uri);
  };

  const handleCancel = async () => {
    await audioService.stopRecording();
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{formatTime(duration)}</Text>
      <Animated.View style={[styles.waveform, { transform: [{ scale: pulseAnim }] }]} />
      <View style={styles.controls}>
        {!isRecording ? (
          <TouchableOpacity style={styles.recordBtn} onPress={handleStart}>
            <Text style={styles.btnText}>Record</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.controlBtn} onPress={isPaused ? handleResume : handlePause}>
              <Text style={styles.btnText}>{isPaused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn} onPress={handleStop}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12 },
  timer: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  waveform: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ff4757', marginBottom: 20 },
  controls: { flexDirection: 'row', gap: 10 },
  recordBtn: { backgroundColor: '#ff4757', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  controlBtn: { backgroundColor: '#2ed573', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  cancelBtn: { backgroundColor: '#a4b0be', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});