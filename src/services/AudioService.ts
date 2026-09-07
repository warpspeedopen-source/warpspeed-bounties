import { Audio } from 'expo-av';

export interface AudioNote {
  id: string;
  uri: string;
  durationMillis: number;
  transcription?: string;
}

class AudioService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  
  async startRecording(): Promise<void> {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      this.recording = recording;
    } catch (err) {
      console.error('Failed to start recording', err);
      throw err;
    }
  }

  async pauseRecording(): Promise<void> {
    if (this.recording) {
      await this.recording.pauseAsync();
    }
  }

  async resumeRecording(): Promise<void> {
    if (this.recording) {
      await this.recording.startAsync();
    }
  }

  async stopRecording(): Promise<{ uri: string; durationMillis: number } | null> {
    if (!this.recording) return null;
    
    try {
      await this.recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();
      this.recording = null;
      
      if (uri) {
        return { uri, durationMillis: status.durationMillis || 0 };
      }
      return null;
    } catch (err) {
      console.error('Failed to stop recording', err);
      this.recording = null;
      throw err;
    }
  }

  async cancelRecording(): Promise<void> {
    if (this.recording) {
      await this.recording.stopAndUnloadAsync();
      this.recording = null;
    }
  }

  async playSound(uri: string, positionMillis: number = 0): Promise<Audio.Sound> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { positionMillis, shouldPlay: true }
      );
      this.sound = sound;
      return sound;
    } catch (err) {
      console.error('Failed to play sound', err);
      throw err;
    }
  }

  async setPlaybackRate(rate: number): Promise<void> {
    if (this.sound) {
      await this.sound.setRateAsync(rate, true);
    }
  }

  async stopSound(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
  }

  async transcribeAudio(uri: string): Promise<string> {
    // Mock API call to backend service for transcription
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("This is a mock transcription of the audio note.");
      }, 1500);
    });
  }
}

export const audioService = new AudioService();
