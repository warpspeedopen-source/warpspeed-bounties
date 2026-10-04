<content>
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { Audio } from 'react-native-av';
import Waveform from './Waveform';
import { AudioService } from '../services/AudioService';
import { AudioPlayerProps } from '../types/audio';

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioFile,
  onPlaybackEnd,
  onDelete,
}) => {
  const [isPlaying, setIsPlaying = useState(false);
  const [isPaused, setIsPaused = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [lastPosition, setLastPosition] = useState(0);
  
  const audioRef = useRef<Audio.Sound | null>(null);
  const audioService = useRef(new AudioService());

  useEffect(() => {
    if (audioFile) {
      setupAudio();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.unloadAsync();
      }
    };
  }, [audioFile]);

  const setupAudio = async () => {
    try {
      if (audioRef.current) {
        await audioRef.current.unloadAsync();
      }

      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: audioFile.uri }, { shouldPlay: false });
      
      const status = await sound.getStatusAsync();
      setDuration(status.durationMillis || 0);
      setCurrentTime(lastPosition);
      
      // Set up playback status update
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      
      audioRef.current = sound;
    } catch (error) {
      console.error('Failed to setup audio:', error);
      Alert.alert('Error', 'Failed to load audio file');
    }
  };

  const onPlaybackStatusUpdate = async (status: any) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setIsPaused(false);
        setLastPosition(0);
        if (onPlaybackEnd) {
          onPlaybackEnd();
        }
      }
    }
  };

  const play = async () => {
    try {
      if (audioRef.current) {
        const status = await audioRef.current.getStatusAsync();
        const newPosition = status.isLoaded ? lastPosition : 0;
        
        await audioRef.current.playFromPositionAsync(newPosition);
        setIsPlaying(true);
        setIsPaused(false);
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  const pause = async () => {
    try {
      if (audioRef.current) {
        await audioRef.current.pauseAsync();
        setIsPaused(true);
        setIsPlaying(false);
        setLastPosition(currentTime);
      }
    } catch (error) {
      console.error('Failed to pause audio:', error);
    }
  };

  const stop = async () => {
    try {
      if (audioRef.current) {
        await audioRef.current.stopAsync();
        setIsPlaying(false);
        setIsPaused(false);
        setLastPosition(0);
        setCurrentTime(0);
      }
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
  };

  const seek = async (position: number) => {
    try {
      if (audioRef.current) {
        await audioRef.current.setStatusAsync({ positionMillis: position });
        setCurrentTime(position);
      }
    } catch (error) {
      console.error('Failed to seek audio:', error);
    }
  };

  const changePlaybackRate = async (rate: number) => {
    try {
      if (audioRef.current) {
        await audioRef.current.setStatusAsync { playbackRate: rate });
        setPlaybackRate(rate);
      }
    } catch (error) {
      console.error('Failed to change playback rate:', error);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressPress = (event: any) => {
    const layout = event.nativeEvent.layout;
    const position = (event.nativeEvent.locationX / layout.width) * duration;
    seek(position);
  };

  if (!audioFile) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {audioFile.filename}
        </Text>
        {onDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.waveformContainer}>
        <Waveform 
          isPlaying={isPlaying} 
          isPaused={isPaused} 
          progress={duration > 0 ? currentTime / duration : 0}
        />
      </View>
      
      <View style={styles.timeInfo}>
        <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
        <Text style={styles.duration}>{formatTime(duration)}</Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }]} 
          />
        </View>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => seek(currentTime - 10000)}>
          <Text style={styles.controlButtonText}>-10s</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.playButton} onPress={isPlaying || isPaused ? pause : play}>
          <Text style={styles.playButtonText}>
            {isPlaying || isPaused ? 'Pause' : 'Play'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={() => seek(currentTime + 10000)}>
          <Text style={styles.controlButtonText}>+10s</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.speedControls}>
        <Text style={styles.speedLabel}>Speed:</Text>
        <TouchableOpacity 
          style={[styles.speedButton, playbackRate === 0.5 && styles.speedButtonActive]} 
          onPress={() => changePlaybackRate(0.5)}
        >
          <Text style={styles.speedButtonText}>0.5x</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.speedButton, playbackRate === 1.0 && styles.speedButtonActive]} 
          onPress={() => changePlaybackRate(1.0)}
        >
          <Text style={styles.speedButtonText}>1x</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.speedButton, playbackRate === 1.5 && styles.speedButtonActive]} 
          onPress={() => changePlaybackRate(1.5)}
        >
          <Text style={styles.speedButtonText}>1.5x</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.speedButton, playbackRate === 2.0 && styles.speedButtonActive]} 
          onPress={() => changePlaybackRate(2.0)}
        >
          <Text style={styles.speedButtonText}>2x</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  deleteButton: {
    padding: 6,
    backgroundColor: '#f44336',
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  waveformContainer: {
    height: 60,
    marginBottom: 12,
    justifyContent: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currentTime: {
    fontSize: 14,
    color: '#666',
  },
  duration: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    marginBottom: 16,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressBar: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  playButton: {
    padding: 12,
    backgroundColor: '#2196F3',
    borderRadius: 24,
    minWidth: 80,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controlButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  speedControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  speedButton: {
    padding: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  speedButtonActive: {
    backgroundColor: '#2196F3',
  },
  speedButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
});

export default AudioPlayer;