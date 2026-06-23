import { useState, useRef, useCallback } from 'react';
import { RecordingState, AudioFormat, AudioQuality } from '../types/audio.types';

export function useAudioRecording() {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [uri, setUri] = useState<string | null>(null);
  const recorderRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const start = useCallback(async (opts?: { format?: AudioFormat; quality?: AudioQuality }) => {
    try {
      setState('recording');
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch { setState('error'); }
  }, []);

  const stop = useCallback(async () => {
    setState('stopped');
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const pause = useCallback(() => { setState('paused'); }, []);
  const resume = useCallback(() => { setState('recording'); }, []);

  return { state, duration, uri, start, stop, pause, resume };
}
