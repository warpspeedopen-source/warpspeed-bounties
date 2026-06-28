import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

class AudioService {
  private static instance: AudioService;
  private recording: Audio.Recording | null = null;
  private soundObject: Audio.Sound | null = null;

  private constructor() {}

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  async startRecording(): Promise<{ uri: string; status: any }> {
    try {
      // In a real implementation, we would use:
      // await Audio.requestPermissionsAsync();
      // await Audio.setAudioModeAsync({
      //   allowsRecordingWhile-muted: true,
      //   playsInSilentModeIOS: true,
      // });
      
      // For this mock implementation, we'll just simulate the structure
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      this.recording = recording;
      
      const { recordingStatus } = await this.recording.startAsync();
      
      return {
        uri: this.recording.getURI() || '',
        status: recordingStatus
      };
    } catch (error) {
      throw error;
    }
  }

  async stopRecording(): Promise<{ uri: string; status: any }> {
    if (this.recording) {
      const status = await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      return { uri: uri || '', status };
    }
    return { uri: '', status: null };
  }

  async playAudio(uri: string): Promise<void> {
    try {
      this.soundObject = new Audio.Sound();
      await this.soundObject.loadAsync({ uri });
      await this.soundObject.playAsync();
    } catch (error) {
      throw error;
    }
  }

  async stopPlayback(): Promise<void> {
    if (this.soundObject) {
      await this.soundObject.stopAsync();
    }
  }

  async getAudioDuration(uri: string): Promise<number> {
    try {
      const initialStatus = await Audio.Sound.create(
        { uri },
        {},
        false
      );
      return initialStatus.status.durationMillis || 0;
    } catch (error) {
      throw error;
    }
  }

  async getAudioPosition(): Promise<number> {
    if (this.soundObject) {
      const status = await this.soundObject.getStatusAsync();
      return status.positionMillis || 0;
    }
    return 0;
  }

  async pause(): Promise<void> {
    if (this.soundObject) {
      await this.soundObject.pauseAsync();
    }
  }

  async setPlaybackPosition(position: number): Promise<void> {
    if (this.soundObject) {
      await this.soundObject.setPositionAsync(position);
    }
  }
}

export default AudioService;