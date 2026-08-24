import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

export class AudioService {
  private recording: Audio.Recording | null = null;
  private playback: Audio.Sound | null = null;

  async requestPermissions() {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  }

  async startRecording() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    });
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    this.recording = recording;
  }

  async pauseRecording() {
    if (this.recording) await this.recording.pauseAsync();
  }

  async resumeRecording() {
    if (this.recording) await this.recording.startAsync();
  }

  async stopRecording(): Promise<string | null> {
    if (!this.recording) return null;
    await this.recording.stopAndUnloadAsync();
    const uri = this.recording.getURI();
    this.recording = null;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    return uri;
  }

  async playAudio(uri: string, onPlaybackUpdate?: (status: any) => void) {
    if (this.playback) {
      await this.playback.unloadAsync();
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
      onPlaybackUpdate
    );
    this.playback = sound;
    return sound;
  }

  async pauseAudio() {
    if (this.playback) await this.playback.pauseAsync();
  }

  async resumeAudio() {
    if (this.playback) await this.playback.playAsync();
  }

  async setPlaybackSpeed(rate: number) {
    if (this.playback) {
      await this.playback.setRateAsync(rate, true);
    }
  }

  async seekAudio(positionMillis: number) {
    if (this.playback) {
      await this.playback.setPositionAsync(positionMillis);
    }
  }

  async stopAudio() {
    if (this.playback) {
      await this.playback.stopAsync();
      await this.playback.unloadAsync();
      this.playback = null;
    }
  }
}

export const audioService = new AudioService();