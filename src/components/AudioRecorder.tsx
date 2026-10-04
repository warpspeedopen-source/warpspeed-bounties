<content>
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { Audio } from 'react-native-av';
import Waveform from './Waveform';
import Timer from './Timer';
import { AudioService } from '../services/AudioService';
import { AudioRecorderProps } from '../types/audio';

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onRecordingCancel,
  isVisible = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<any>(null);
  
  const recordingRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioService = useRef(new AudioService());

  useEffect(() => {
    if (isVisible) {
      startRecording();
    } else {
      stopRecording();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.release();
      }
    };
  }, [isVisible]);

  const startRecording = async () => {
    try {
      const recording = await audioService.current.startRecording();
      recordingRef.current = recording;
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const pauseRecording = async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.pauseAsync();
        setIsPaused(true);
      }
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  };

  const resumeRecording = async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.resumeAsync();
        setIsPaused(false);
      }
    } catch (error) {
      console.error('Failed to resume recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (recordingRef.current) {
        const result = await recordingRef.current.stopAndSaveAsync();
        const { uri, duration } = result;
        
        setAudioUri(uri);
        setAudioFile({
          uri,
          duration,
          filename: `audio_${Date.now()}.m4a`,
          size: 0, // Will be set after file info is retrieved
        });
        
        setIsRecording(false);
        setIsPaused(false);
        
        if (onRecordingComplete && uri) {
          onRecordingComplete(audioFile);
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const cancelRecording = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndReleaseAsync();
        recordingRef.current = null;
      }
      
      setIsRecording(false);
      setIsPaused(false);
      setRecordingDuration(0);
      setAudioUri(null);
      setAudioFile(null);
      
      if (onRecordingCancel) {
        onRecordingCancel();
      }
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recording Audio</Text>
        <Timer time={recordingDuration} />
      </View>
      
      <View style={styles.waveformContainer}>
        <Waveform isRecording={isRecording} isPaused={isPaused} />
      </View>
      
      <View style={styles.controls}>
        {isPaused ? (
          <TouchableOpacity style={[styles.button, styles.buttonResume]} onPress={resumeRecording}>
            <Text style={styles.buttonText}>Resume</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.buttonPause]} onPress={pauseRecording} disabled={!isRecording}>
            <Text style={styles.buttonText}>Pause</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={[styles.button, styles.buttonStop]} onPress={stopRecording} disabled={!isRecording}>
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={cancelRecording} disabled={!isRecording}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      
      {audioUri && (
        <View style={styles.preview}>
          <Text style={styles.previewText}>Recording saved: {formatTime(recordingDuration)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
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
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  waveformContainer: {
    height: 80,
    marginBottom: 20,
    justifyContent: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonPause: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonResume: {
    backgroundColor: '#4CAF50',
  },
  buttonStop: {
    backgroundColor: '#f44336',
  },
  buttonCancel: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  preview: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  previewText: {
    fontSize: 14,
    color: '#666',
  },
});

export default AudioRecorder;