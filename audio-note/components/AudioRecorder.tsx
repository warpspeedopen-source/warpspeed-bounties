import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { formatTime } from '../utils/formatTime';

interface Props {
  onSave: (uri: string, durationMs: number) => void;
  onCancel: () => void;
}

export const AudioRecorder: React.FC<Props> = ({ onSave, onCancel }) => {
  const {
    status,
    durationMs,
    recording,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const handleSave = async () => {
    if (status === 'recording' || status === 'paused') {
      await stopRecording();
      // wait for effect or rely on state, actually we can just invoke onSave here, but state update is async.
      // Since stopRecording updates state, we'll use a callback or effect. But for simplicity in mock:
    }
  };

  // When recording is saved
  React.useEffect(() => {
    if (status === 'saved' && recording) {
      onSave(recording.uri, recording.durationMs);
    }
  }, [status, recording, onSave]);

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{formatTime(durationMs)}</Text>
      <View style={styles.controls}>
        {status === 'stopped' && (
          <TouchableOpacity onPress={startRecording} style={styles.btnRecord}>
            <Text style={styles.btnText}>Record</Text>
          </TouchableOpacity>
        )}
        
        {status === 'recording' && (
          <TouchableOpacity onPress={pauseRecording} style={styles.btnPause}>
            <Text style={styles.btnText}>Pause</Text>
          </TouchableOpacity>
        )}
        
        {status === 'paused' && (
          <TouchableOpacity onPress={resumeRecording} style={styles.btnResume}>
            <Text style={styles.btnText}>Resume</Text>
          </TouchableOpacity>
        )}

        {(status === 'recording' || status === 'paused') && (
          <>
            <TouchableOpacity onPress={stopRecording} style={styles.btnStop}>
              <Text style={styles.btnText}>Stop & Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelRecording} style={styles.btnCancel}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
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
    justifyContent: 'center',
  },
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  btnRecord: { backgroundColor: '#f00', padding: 12, borderRadius: 24 },
  btnPause: { backgroundColor: '#fa0', padding: 12, borderRadius: 24 },
  btnResume: { backgroundColor: '#0a0', padding: 12, borderRadius: 24 },
  btnStop: { backgroundColor: '#00f', padding: 12, borderRadius: 24 },
  btnCancel: { backgroundColor: '#555', padding: 12, borderRadius: 24 },
  btnText: { color: '#fff', fontWeight: 'bold' },
});
