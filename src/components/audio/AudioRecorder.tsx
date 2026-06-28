import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { format } from 'date-fns';

interface AudioNoteProps {
  onRecordingComplete: (uri: string, duration: number) => void;
}

export const AudioNote: React.FC<AudioNoteProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mock audio recording implementation
  const startRecording = () => {
    setIsRecording(true);
    // In a real implementation, this would use the device's microphone
    // For now, we'll simulate the recording flow
    let seconds = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      seconds++;
      setRecordingTime(seconds);
    }, 1000);
  };

  const stopRecording = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // Simulate saving the recording
    setIsRecording(false);
  };

  return (
    <View style={styles.container}>
      <Text>Audio Note Component</Text>
      <Text>Recording: {recordingTime}s</Text>
      <TouchableOpacity 
        onPress={startRecording}
        disabled={isRecording}
        style={styles.button}
      >
        <Text>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  button: {
    padding: 10,
    backgroundColor: '#4a90e2',
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
  },
  recordingText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  }
});

export default AudioNote;