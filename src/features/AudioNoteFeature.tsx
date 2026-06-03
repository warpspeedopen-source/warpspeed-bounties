import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  Animated,
} from 'react-native';
import AudioRecorderPlayer, { AVPlaybackStatus, } from 'react-native-audio-recorder-player';
import Slider from '@react-native-community/slider';

// --- DEPENDENCY & SETUP NOTES ---
// This implementation requires the following packages:
// - react-native-audio-recorder-player
// - @react-native-community/slider
//
// For audio recording, you must request microphone permissions.
// Android: Add `<uses-permission android:name=\"android.permission.RECORD_AUDIO\" />` to AndroidManifest.xml
// iOS: Add `NSMicrophoneUsageDescription` to Info.plist
// The `requestMicrophonePermission` function is included as a helper.
//
// A waveform visualization library would enhance the UI. Placeholder components are included.
// --------------------------------

// --- TYPE DEFINITIONS ---
// These would typically live in a shared types directory, e.g., 'src/types/notes.ts'

export interface AudioAttachment {
  uri: string; // Could be a local file path or a remote URL
  durationMillis: number;
  mimeType?: string;
  lastPositionMillis?: number;
}

export interface Note {
  id: string;
  content: string;
  audio?: AudioAttachment;
}

// --- MOCK API SERVICE ---
// This simulates backend interactions for uploading audio and transcription.
// In a real app, this would be in 'src/services/api.ts' and use OpenAPI-generated clients.

const mockApiService = {
  uploadAudio: async (fileUri: string): Promise<{ url: string }> => {
    console.log(`Uploading audio from: ${fileUri}`);
    // Simulate network delay and return a fake remote URL
    return new Promise(resolve =>
      setTimeout(() => {
        const mockUrl = `https://fake-cdn.com/audio/${Date.now()}.m4a`;
        console.log(`Audio uploaded to: ${mockUrl}`);
        resolve({ url: mockUrl });
      }, 1500)
    );
  },
  requestTranscription: async (audioUrl: string): Promise<string> => {
    console.log(`Requesting transcription for: ${audioUrl}`);
    // Simulate transcription delay
    return new Promise(resolve =>
      setTimeout(() => {
        const mockTranscription = `This is a mock transcription of the audio file. It demonstrates how the transcribed text would be appended to the note.`;
        console.log('Transcription received.');
        resolve(mockTranscription);
      }, 3000)
    );
  },
};

// --- HELPERS ---

async function requestMicrophonePermission() {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone to record audio notes.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  } else {
    // For iOS, permission is requested automatically when you start recording.
    // You can also use a library like react-native-permissions for a unified API.
    return true;
  }
}

const formatTime = (millis: number) => {
  const totalSeconds = Math.floor(millis / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// --- AUDIO RECORDER HOOK ---

const useAudioRecorder = (onRecordingComplete: (file: { path: string, duration: number }) => void) => {
  const recorderRef = useRef<AudioRecorderPlayer | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  useEffect(() => {
    recorderRef.current = new AudioRecorderPlayer();
    recorderRef.current.setSubscriptionDuration(0.1);
    return () => {
      recorderRef.current?.removeRecordBackListener();
      recorderRef.current = null;
    };
  }, []);

  const startRecording = async () => {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission || !recorderRef.current) return;

    setIsRecording(true);
    setIsPaused(false);
    const path = Platform.select({
      ios: 'audio.m4a',
      android: 'sdcard/audio.mp4',
    });
    await recorderRef.current.startRecorder(path);
    recorderRef.current.addRecordBackListener(e => {
      setRecordTime(e.currentPosition);
    });
  };

  const stopRecording = async () => {
    if (!recorderRef.current || !isRecording) return;

    const result = await recorderRef.current.stopRecorder();
    recorderRef.current.removeRecordBackListener();
    setIsRecording(false);
    setIsPaused(false);
    onRecordingComplete({ path: result, duration: recordTime });
    setRecordTime(0);
  };

  const pauseRecording = async () => {
    if (!recorderRef.current) return;
    await recorderRef.current.pauseRecorder();
    setIsPaused(true);
  };

  const resumeRecording = async () => {
    if (!recorderRef.current) return;
    await recorderRef.current.resumeRecorder();
    setIsPaused(false);
  };

  const cancelRecording = async () => {
    if (!recorderRef.current || !isRecording) return;
    await recorderRef.current.stopRecorder();
    recorderRef.current.removeRecordBackListener();
    setIsRecording(false);
    setIsPaused(false);
    setRecordTime(0);
    // Note: onRecordingComplete is NOT called on cancel
  };

  return { isRecording, isPaused, recordTime, startRecording, stopRecording, pauseRecording, resumeRecording, cancelRecording };
};

// --- AUDIO PLAYER HOOK ---

const useAudioPlayer = (audioUri?: string, initialPosition: number = 0, onSavePosition?: (position: number) => void) => {
  const playerRef = useRef<AudioRecorderPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  useEffect(() => {
    playerRef.current = new AudioRecorderPlayer();
    playerRef.current.setSubscriptionDuration(0.1);

    return () => {
        playerRef.current?.stopPlayer();
        playerRef.current?.removePlayBackListener();
        if (onSavePosition && currentTime > 0) {
          onSavePosition(currentTime);
        }
        playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPlayback = async () => {
    if (!playerRef.current || !audioUri) return;

    await playerRef.current.startPlayer(audioUri);
    await playerRef.current.seekToPlayer(initialPosition);
    await playerRef.current.setSpeed(playbackSpeed);
    setIsPlaying(true);

    playerRef.current.addPlayBackListener((e: AVPlaybackStatus) => {
        if (e.currentPosition >= e.duration) {
            stopPlayback();
        } else {
            setCurrentTime(e.currentPosition);
            setDuration(e.duration);
        }
    });
  };

  const stopPlayback = async () => {
      if (!playerRef.current) return;
      await playerRef.current.stopPlayer();
      playerRef.current.removePlayBackListener();
      setIsPlaying(false);
      setCurrentTime(0);
  };

  const pausePlayback = async () => {
    if (!playerRef.current) return;
    await playerRef.current.pausePlayer();
    setIsPlaying(false);
  };

  const resumePlayback = async () => {
    if (!playerRef.current) return;
    await playerRef.current.resumePlayer();
    setIsPlaying(true);
  };
  
  const seekTo = async (millis: number) => {
    if (!playerRef.current) return;
    await playerRef.current.seekToPlayer(millis);
    setCurrentTime(millis);
  };

  const setSpeed = async (speed: number) => {
    if (!playerRef.current) return;
    await playerRef.current.setSpeed(speed);
    setPlaybackSpeed(speed);
  };

  return { isPlaying, duration, currentTime, playbackSpeed, startPlayback, stopPlayback, pausePlayback, resumePlayback, seekTo, setSpeed };
};

// --- UI COMPONENTS ---

const RecordingWaveform = ({ isRecording }: { isRecording: boolean }) => {
  // A real implementation would use a library to visualize microphone input.
  // This is a placeholder animation.
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      waveAnim.stopAnimation();
      waveAnim.setValue(0);
    }
  }, [isRecording, waveAnim]);

  const scale = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <View style={styles.waveformContainer}>
      <Animated.View style={[styles.waveformDot, { transform: [{ scale }] }]} />
      <Text style={styles.waveformText}>Recording...</Text>
    </View>
  );
};

const AudioRecorderUI = ({ onSave, onCancel }: { onSave: (file: {path: string, duration: number}) => void; onCancel: () => void; }) => {
    const { isRecording, isPaused, recordTime, startRecording, stopRecording, pauseRecording, resumeRecording, cancelRecording } = useAudioRecorder(onSave);

    useEffect(() => {
        startRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCancel = () => {
        cancelRecording();
        onCancel();
    }

    return (
        <View style={styles.recorderContainer}>
            <Text style={styles.recorderTimer}>{formatTime(recordTime)}</Text>
            <RecordingWaveform isRecording={isRecording && !isPaused} />
            <View style={styles.recorderControls}>
                <TouchableOpacity onPress={handleCancel} style={styles.recorderButton}>
                    <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={isPaused ? resumeRecording : pauseRecording} 
                    style={[styles.recorderButton, styles.recordPauseButton]} 
                    disabled={!isRecording}
                >
                    <Text style={{fontSize: 24, color: 'blue'}}>{isPaused ? '▶️' : '⏸️'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={stopRecording} style={styles.recorderButton}>
                    <Text>Save</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const AudioPlayerUI = ({ audio, onSavePosition, onDelete }: { audio: AudioAttachment, onSavePosition: (position: number) => void, onDelete: () => void }) => {
  const { isPlaying, duration, currentTime, playbackSpeed, startPlayback, pausePlayback, seekTo, setSpeed } = useAudioPlayer(audio.uri, audio.lastPositionMillis, onSavePosition);

  const speeds = [1.0, 1.5, 2.0];
  const handleSpeedChange = () => {
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setSpeed(speeds[nextIndex]);
  };

  useEffect(() => {
      // Stop playback when component unmounts
      return () => {
          // The hook's cleanup will handle stopping the player and saving position
      };
  }, []);

  return (
    <View style={styles.playerContainer}>
        <View style={styles.playerControls}>
            <TouchableOpacity onPress={isPlaying ? pausePlayback : startPlayback} style={styles.playButton}>
                <Text style={styles.playButtonText}>{isPlaying ? '⏸️' : '▶️'}</Text>
            </TouchableOpacity>
            <View style={styles.progressContainer}>
                <Slider
                    style={{flex: 1}}
                    minimumValue={0}
                    maximumValue={duration || 1}
                    value={currentTime}
                    onSlidingComplete={seekTo}
                    minimumTrackTintColor="#007AFF"
                    maximumTrackTintColor="#DDD"
                />
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
            </View>
        </View>
        <View style={styles.playerOptions}>
            <TouchableOpacity onPress={handleSpeedChange} style={styles.optionButton}>
                <Text>{playbackSpeed.toFixed(1)}x</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.optionButton}>
                <Text>🗑️</Text>
            </TouchableOpacity>
        </View>
    </View>
  );
}

// --- MAIN FEATURE COMPONENT ---

interface AudioNoteFeatureProps {
  note: Note;
  onUpdateNote: (updatedNote: Note) => void;
}

export const AudioNoteFeature = ({ note, onUpdateNote }: AudioNoteFeatureProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleRecordingComplete = async (recordedFile: { path: string, duration: number }) => {
    setIsRecording(false);
    // In a real app, we'd show a loading indicator here
    const { url } = await mockApiService.uploadAudio(recordedFile.path);
    const newAudioAttachment: AudioAttachment = {
      uri: url,
      durationMillis: recordedFile.duration,
    };
    onUpdateNote({ ...note, audio: newAudioAttachment });
  };

  const handleDeleteAudio = () => {
    const { audio, ...noteWithoutAudio } = note;
    onUpdateNote(noteWithoutAudio);
  };

  const handleTranscribe = async () => {
    if (!note.audio) return;
    setIsTranscribing(true);
    try {
      const transcription = await mockApiService.requestTranscription(note.audio.uri);
      const newContent = note.content ? `${note.content}\n\n--- Transcription ---\n${transcription}` : transcription;
      onUpdateNote({ ...note, content: newContent });
    } catch (error) {
      console.error('Transcription failed:', error);
      // Show error to user
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSavePosition = useCallback((position: number) => {
    if (note.audio) {
        const updatedAudio = { ...note.audio, lastPositionMillis: position };
        onUpdateNote({ ...note, audio: updatedAudio });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.audio, onUpdateNote]);

  return (
    <View style={styles.container}>
      {note.audio ? (
        <View>
          <AudioPlayerUI audio={note.audio} onDelete={handleDeleteAudio} onSavePosition={handleSavePosition}/>
          <TouchableOpacity style={styles.transcribeButton} onPress={handleTranscribe} disabled={isTranscribing}>
            <Text style={styles.buttonText}>{isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.recordButton} onPress={() => setIsRecording(true)}>
          <Text style={styles.buttonText}>🎤 Record Audio Note</Text>
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isRecording}
        onRequestClose={() => setIsRecording(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <AudioRecorderUI 
              onSave={handleRecordingComplete}
              onCancel={() => setIsRecording(false)}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

// --- STYLES ---

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  recordButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '40%',
  },
  recorderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  recorderTimer: {
    fontSize: 40,
    fontWeight: '200',
  },
  recorderControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  recorderButton: {
    padding: 15,
  },
  recordPauseButton: {
    backgroundColor: '#EFEFEF',
    borderRadius: 50,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waveformDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    marginRight: 8,
  },
  waveformText: {
    color: '#555',
  },
  playerContainer: {
    padding: 10,
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    marginRight: 10,
  },
  playButtonText: {
      fontSize: 30,
  },
  progressContainer: {
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#888',
  },
  playerOptions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8,
  },
  optionButton: {
      marginLeft: 15,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: '#EFEFEF',
      borderRadius: 4,
  },
  transcribeButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
