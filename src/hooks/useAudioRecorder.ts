import { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/AudioService';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [durationMillis, setDurationMillis] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDurationMillis((prev) => prev + 100);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      await audioService.startRecording();
      setIsRecording(true);
      setIsPaused(false);
      setDurationMillis(0);
    } catch (err) {
      console.error(err);
    }
  };

  const pauseRecording = async () => {
    await audioService.pauseRecording();
    setIsPaused(true);
  };

  const resumeRecording = async () => {
    await audioService.resumeRecording();
    setIsPaused(false);
  };

  const stopRecording = async () => {
    const result = await audioService.stopRecording();
    setIsRecording(false);
    setIsPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
    return result;
  };

  const cancelRecording = async () => {
    await audioService.cancelRecording();
    setIsRecording(false);
    setIsPaused(false);
    setDurationMillis(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return {
    isRecording,
    isPaused,
    durationMillis,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  };
};
