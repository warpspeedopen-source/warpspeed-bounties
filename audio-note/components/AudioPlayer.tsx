import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AudioService } from '../services/AudioService';
import { formatTime } from '../utils/formatTime';

interface Props {
  uri: string;
  durationMs: number;
  initialPositionMs?: number;
  onPositionChange?: (positionMs: number) => void;
}

export const AudioPlayer: React.FC<Props> = ({ uri, durationMs, initialPositionMs = 0, onPositionChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(initialPositionMs);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setPositionMs((prev) => {
          const next = prev + 100;
          if (next >= durationMs) {
            setIsPlaying(false);
            AudioService.pause();
            return durationMs;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationMs]);

  useEffect(() => {
    if (onPositionChange) {
      onPositionChange(positionMs);
    }
  }, [positionMs, onPositionChange]);

  const togglePlayPause = async () => {
    if (isPlaying) {
      await AudioService.pause();
      setIsPlaying(false);
    } else {
      if (positionMs >= durationMs) {
        setPositionMs(0); // restart
      }
      await AudioService.play(uri, positionMs >= durationMs ? 0 : positionMs);
      setIsPlaying(true);
    }
  };

  const seek = async (newPos: number) => {
    const pos = Math.max(0, Math.min(newPos, durationMs));
    setPositionMs(pos);
    await AudioService.seek(pos);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={togglePlayPause} style={styles.playBtn}>
        <Text style={styles.btnText}>{isPlaying ? 'Pause' : 'Play'}</Text>
      </TouchableOpacity>
      
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(positionMs)}</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${(positionMs / durationMs) * 100}%` }]} />
        </View>
        <Text style={styles.timeText}>{formatTime(durationMs)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  playBtn: {
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 4,
  },
  btnText: { color: '#fff' },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#555',
    width: 40,
    textAlign: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 8,
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007aff',
    borderRadius: 2,
  },
});
