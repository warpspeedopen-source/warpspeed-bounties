import { Audio } from 'expo-av';
import { 
  type Audio as AudioType,
  type Recording as RecordingType 
} from 'expo-av';

class AudioNoteService {
  private static instance: AudioNoteService;
  private recording: AudioType.Sound | null = null;
  private recordingObject: RecordingType | null = null;
  private isRecording = false;
  private startTime: number = 0;
  private elapsedTime: number = 0;
  private observers: Array<(duration: number) => void> = [];

  private constructor() {}

  static getInstance(): AudioNoteService {
    if (!AudioNoteService.instance) {
      AudioNoteService.instance = new AudioNote