import { useState, useEffect, useRef } from 'react';
import { AudioService } from '../services/AudioService';
import { AudioRecording } from '../types/audio';

export const useAudioRecorder = () => {
  const [status, setStatus] = useState<AudioRecording['status']>('stopped');
  const [durationMs, setDurationMs] = useState(0);
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDurationMs((prev) => prev + 100); // simulate 100ms ticks
    }, 100);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    await AudioService.startRecording();
    setStatus('recording');
    setDurationMs(0);
    setRecording(null);
    startTimer();
  };

  const pauseRecording = async () => {
    await AudioService.pauseRecording();
    setStatus('paused');
    stopTimer();
  };

  const resumeRecording = async () => {
    await AudioService.resumeRecording();
    setStatus('recording');
    startTimer();
  };

  const stopRecording = async () => {
    const savedRecording = await AudioService.stopRecording();
    // Use actual elapsed time for mock duration
    savedRecording.durationMs = durationMs;
    setStatus('saved');
    setRecording(savedRecording);
    stopTimer();
  };

  const cancelRecording = async () => {
    await AudioService.cancelRecording();
    setStatus('stopped');
    setDurationMs(0);
    setRecording(null);
    stopTimer();
  };

  useEffect(() => {
    return () => stopTimer();
  }, []);

  return {
    status,
    durationMs,
    recording,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  };
};
