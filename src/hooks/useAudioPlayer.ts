import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { audioService } from '../services/AudioService';

export const useAudioPlayer = (uri: string, initialPosition: number = 0) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(initialPosition);
  const [durationMillis, setDurationMillis] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPositionMillis(status.positionMillis);
      setDurationMillis(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPositionMillis(0);
      }
    }
  };

  const play = async () => {
    if (!sound) {
      const newSound = await audioService.playSound(uri, positionMillis);
      newSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      newSound.setRateAsync(playbackRate, true);
      setSound(newSound);
    } else {
      await sound.playAsync();
    }
    setIsPlaying(true);
  };

  const pause = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const seekTo = async (millis: number) => {
    if (sound) {
      await sound.setPositionAsync(millis);
      setPositionMillis(millis);
    } else {
      setPositionMillis(millis);
    }
  };

  const changePlaybackRate = async (rate: number) => {
    setPlaybackRate(rate);
    if (sound) {
      await sound.setRateAsync(rate, true);
    }
  };

  return {
    isPlaying,
    positionMillis,
    durationMillis,
    playbackRate,
    play,
    pause,
    seekTo,
    changePlaybackRate,
  };
};
