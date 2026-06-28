import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { AudioRecording, AudioNote } from '../types/audio';

class AudioService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private currentPosition: number = 0;
  private isPlaying: boolean = false;

  // Initialize recording
  async startRecording(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.stopAndUnload();
      }
      
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      this.recording = recording;
    } catch (error) {
      console.error('Failed to start recording', error);
      throw error;
    }
  }

  // Pause recording
  async pauseRecording(): Promise<void> {
    if (this.recording && this.recording.getState() === Audio.Recording.RecordingStatusRecorded) {
      await this.recording.pause();
    }
  }

  // Resume recording
  async resumeRecording(): Promise<void> {
    if (this.recording && this.recording.getState() === Audio.Recording.RecordingStatusPaused) {
      await this.recording.resume();
    }
  }

  // Stop recording and get file URI
  async stopRecording(): Promise<string | null> {
    if (this.recording) {
      try {
        await this.recording.stopAndUnload();
        const uri = this.recording.getUri();
        this.recording = null;
        return uri;
      } catch (error) {
        console.error('Failed to stop recording', error);
        return null;
      }
    }
    return null;
  }

  // Cancel recording
  async cancelRecording(): Promise<void> {
    if (this.recording) {
      await this.recording.stopAndUnload();
      this.recording = null;
    }
  }

  // Start playback
  async playAudio(uri: string, position?: number): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { positionMillis: position || this.currentPosition }
      );
      
      this.sound = sound;
      this.isPlaying = true;
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          this.currentPosition = status.positionMillis;
          this.isPlaying = status.didJustFinish ? false : status.isPlaying;
        }
      });

      await this.sound.playAsync();
    } catch (error) {
      console.error('Failed to play audio', error);
      throw error;
    }
  }

  // Pause playback
  async pauseAudio(): Promise<void> {
    if (this.sound && this.isPlaying) {
      await this.sound.pauseAsync();
      this.isPlaying = false;
    }
  }

  // Resume playback
  async resumeAudio(): Promise<void> {
    if (this.sound && !this.isPlaying) {
      await this.sound.playAsync();
      this.isPlaying = true;
    }
  }

  // Stop playback
  async stopAudio(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
      this.isPlaying = false;
      this.currentPosition = 0;
    }
  }

  // Seek to position
  async seekToPosition(position: number): Promise<void> {
    if (this.sound) {
      await this.sound.setPositionAsync(position);
    }
  }

  // Set playback speed
  async setPlaybackSpeed(rate: number): Promise<void> {
    if (this.sound) {
      await this.sound.setRateAsync(rate, true);
    }
  }

  // Get current position
  getCurrentPosition(): number {
    return this.currentPosition;
  }

  // Get recording status
  getRecordingStatus(): Audio.Recording.RecordingStatus | null {
    if (this.recording) {
      return this.recording.getStatus();
    }
    return null;
  }

  // Get playback status
  async getPlaybackStatus(): Promise<Audio.Sound.PlaybackStatus | null> {
    if (this.sound) {
      return await this.sound.getStatusAsync();
    }
    return null;
  }

  // Save audio file to permanent location
  async saveAudioFile(uri: string, filename: string): Promise<string> {
    const newPath = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.copyAsync({ from: uri, to: newPath });
    return newPath;
  }

  // Delete audio file
  async deleteAudioFile(uri: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(uri);
    } catch (error) {
      console.warn('Failed to delete audio file', error);
    }
  }

  // Transcribe audio (placeholder for API integration)
  async transcribeAudio(uri: string): Promise<string> {
    // This would integrate with a transcription API
    // For now, return placeholder text
    return "Transcription of your audio note will appear here...";
  }
}

export default new AudioService();