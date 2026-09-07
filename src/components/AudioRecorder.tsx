import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { formatTimeMillis } from '../utils/formatTime';

interface AudioRecorderProps {
  onSave: (uri: string, durationMillis: number) => void;
  onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSave, onCancel }) => {
  const {
    isRecording,
    isPaused,
    durationMillis,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const handleStopAndSave = async () => {
    const result = await stopRecording();
    if (result) {
      onSave(result.uri, result.durationMillis);
    }
  };

  const handleCancel = async () => {
    await cancelRecording();
    onCancel();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{formatTimeMillis(durationMillis)}</Text>
      
      {/* Waveform placeholder */}
      {isRecording && !isPaused && (
        <View style={styles.waveformContainer}>
          <Text style={styles.waveformText}>Recording in progress...</Text>
        </View>
      )}

      <View style={styles.controls}>
        {!isRecording ? (
          <TouchableOpacity style={styles.button} onPress={startRecording}>
            <Text style={styles.buttonText}>Start Recording</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.button} onPress={isPaused ? resumeRecording : pauseRecording}>
              <Text style={styles.buttonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={handleStopAndSave}>
              <Text style={styles.buttonText}>Stop & Save</Text>
            </TouchableOpacity>
          </>
        )}
        
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginVertical: 8,
  },
  timer: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  waveformContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  waveformText: {
    color: 'red',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  stopButton: {
    backgroundColor: '#4CD964',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
