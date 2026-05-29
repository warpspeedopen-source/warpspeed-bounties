import { AudioRecording } from '../types/audio';

export interface IAudioService {
  startRecording(): Promise<void>;
  pauseRecording(): Promise<void>;
  resumeRecording(): Promise<void>;
  stopRecording(): Promise<AudioRecording>;
  cancelRecording(): Promise<void>;
  play(uri: string, position?: number): Promise<void>;
  pause(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  setPlaybackSpeed(speed: number): Promise<void>;
  getCurrentPosition(): Promise<number>;
}

class AudioServiceMock implements IAudioService {
  private recording: boolean = false;
  private playing: boolean = false;
  private currentUri: string | null = null;
  private position: number = 0;
  private duration: number = 0;

  async startRecording(): Promise<void> {
    this.recording = true;
  }
  async pauseRecording(): Promise<void> {
    this.recording = false;
  }
  async resumeRecording(): Promise<void> {
    this.recording = true;
  }
  async stopRecording(): Promise<AudioRecording> {
    this.recording = false;
    return {
      id: Math.random().toString(36).substr(2, 9),
      uri: 'file://mock/audio.m4a',
      durationMs: 5000,
      createdAt: Date.now(),
      status: 'saved',
    };
  }
  async cancelRecording(): Promise<void> {
    this.recording = false;
  }

  async play(uri: string, position: number = 0): Promise<void> {
    this.currentUri = uri;
    this.position = position;
    this.playing = true;
  }
  async pause(): Promise<void> {
    this.playing = false;
  }
  async seek(positionMs: number): Promise<void> {
    this.position = positionMs;
  }
  async setPlaybackSpeed(speed: number): Promise<void> {
    // speed logic
  }
  async getCurrentPosition(): Promise<number> {
    return this.position;
  }
}

export const AudioService = new AudioServiceMock();
