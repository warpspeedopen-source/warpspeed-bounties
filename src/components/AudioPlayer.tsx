import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Slider, Share } from 'react-native';
import { audioService } from '../services/AudioService';

interface AudioPlayerProps {
  uri: string;
  initialPosition?: number;
  onPositionChange?: (position: number) => void;
  onTranscribe?: (uri: string) => void;
  onDelete?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  uri, 
  initialPosition = 0, 
  onPositionChange, 
  onTranscribe, 
  onDelete 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(initialPosition);
  const [speed, setSpeed] = useState(1);
  const soundRef = useRef<any>(null);
  const hasSeekedRef = useRef(false);

  useEffect(() => {
    return () => {
      audioService.stopAudio();
      if (onPositionChange) onPositionChange(position);
    };
  }, []);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
      
      if (!hasSeekedRef.current && initialPosition > 0 && status.durationMillis > 0) {
        audioService.seekAudio(initialPosition);
        hasSeekedRef.current = true;
      }

      if (status.didJustFinish) {
        setIsPlaying(false);
        if (onPositionChange) onPositionChange(0);
      }
    }
  };

  const togglePlay = async () => {
    if (!soundRef.current) {
      soundRef.current = await audioService.playAudio(uri, onPlaybackStatusUpdate);
    } else {
      if (isPlaying) {
        await audioService.pauseAudio();
      } else {
        await audioService.resumeAudio();
      }
    }
  };

  const changeSpeed = async () => {
    const newSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(newSpeed);
    await audioService.setPlaybackSpeed(newSpeed);
  };

  const handleSeek = async (value: number) => {
    setPosition(value);
    await audioService.seekAudio(value);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        url: uri,
        message: 'Check out this audio note!',
      });
    } catch (error) {
      console.error('Error sharing audio:', error);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.time}>{formatTime(position)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor='#0984e3'
          maximumTrackTintColor='#dfe6e9'
        />
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
          <Text style={styles.btnText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={changeSpeed} style={styles.speedBtn}>
          <Text style={styles.btnText}>{speed}x</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
          <Text style={styles.btnText}>Share</Text>
        </TouchableOpacity>
        {onTranscribe && (
          <TouchableOpacity onPress={() => onTranscribe(uri)} style={styles.actionBtn}>
            <Text style={styles.btnText}>Transcribe</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Text style={styles.btnText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#dfe6e9', marginVertical: 10 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  slider: { flex: 1, marginHorizontal: 10 },
  time: { fontSize: 12, color: '#636e72' },
  controls: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8 },
  playBtn: { backgroundColor: '#0984e3', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  speedBtn: { backgroundColor: '#00b894', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 },
  actionBtn: { backgroundColor: '#6c5ce7', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 },
  deleteBtn: { backgroundColor: '#d63031', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});