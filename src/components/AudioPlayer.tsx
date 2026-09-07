import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { formatTimeMillis } from '../utils/formatTime';

interface AudioPlayerProps {
  uri: string;
  initialPosition?: number;
  onDelete?: () => void;
  onTranscribe?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ uri, initialPosition = 0, onDelete, onTranscribe }) => {
  const {
    isPlaying,
    positionMillis,
    durationMillis,
    playbackRate,
    play,
    pause,
    seekTo,
    changePlaybackRate,
  } = useAudioPlayer(uri, initialPosition);

  const togglePlayback = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const cyclePlaybackRate = () => {
    const nextRate = playbackRate === 1.0 ? 1.5 : playbackRate === 1.5 ? 2.0 : 1.0;
    changePlaybackRate(nextRate);
  };

  const fastForward = () => {
    seekTo(Math.min(positionMillis + 15000, durationMillis));
  };

  const rewind = () => {
    seekTo(Math.max(positionMillis - 15000, 0));
  };

  const progressPercentage = durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
      </View>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTimeMillis(positionMillis)}</Text>
        <Text style={styles.timeText}>{formatTimeMillis(durationMillis)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={rewind}>
          <Text style={styles.controlText}>-15s</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.controlButton, styles.playButton]} onPress={togglePlayback}>
          <Text style={styles.playButtonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={fastForward}>
          <Text style={styles.controlText}>+15s</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={cyclePlaybackRate}>
          <Text style={styles.controlText}>{playbackRate}x</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        {onTranscribe && (
          <TouchableOpacity style={styles.actionButton} onPress={onTranscribe}>
            <Text style={styles.actionText}>Transcribe</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlButton: {
    padding: 8,
  },
  controlText: {
    fontSize: 16,
    color: '#333',
  },
  playButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  playButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  actionButton: {
    padding: 8,
  },
  actionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  deleteButton: {
    marginLeft: 'auto',
  },
  deleteText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
});
