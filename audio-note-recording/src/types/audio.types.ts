/**
 * Audio Note Recording - Type Definitions
 * warpSpeed Bounties Issue #9
 */

/** Recording state machine */
export type RecordingState =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'saving'
  | 'error';

/** Playback state machine */
export type PlaybackState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'error';

/** Playback speed options */
export type PlaybackSpeed = 0.5 | 1.0 | 1.5 | 2.0;

/** Audio format options */
export type AudioFormat = 'm4a' | 'mp3' | 'wav' | 'aac';

/** Audio quality presets */
export type AudioQuality = 'low' | 'medium' | 'high';

/** Audio recording configuration */
export interface AudioRecordingConfig {
  format: AudioFormat;
  quality: AudioQuality;
  sampleRate: number;
  bitRate: number;
  channels: number;
  maxDurationMs: number;
}

/** Audio metadata stored with each recording */
export interface AudioMetadata {
  id: string;
  noteId: string;
  uri: string;
  fileName: string;
  duration: number; // milliseconds
  size: number; // bytes
  format: AudioFormat;
  sampleRate: number;
  bitRate: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  transcription?: TranscriptionResult;
  lastPlaybackPosition?: number; // milliseconds
  lastPlaybackTimestamp?: string; // ISO 8601
}

/** Transcription result from speech-to-text */
export interface TranscriptionResult {
  id: string;
  audioId: string;
  text: string;
  confidence: number;
  language: string;
  segments: TranscriptionSegment[];
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/** Individual transcription segment with timing */
export interface TranscriptionSegment {
  start: number; // milliseconds
  end: number; // milliseconds
  text: string;
  confidence: number;
}

/** Playback progress tracking */
export interface PlaybackProgress {
  position: number; // current position in ms
  duration: number; // total duration in ms
  buffered: number; // buffered position in ms
  progress: number; // 0-1 normalized
}

/** Recording duration info */
export interface RecordingDuration {
  elapsed: number; // ms since recording started
  formatted: string; // "MM:SS" or "HH:MM:SS"
}

/** Waveform data point */
export interface WaveformDataPoint {
  amplitude: number; // 0-1 normalized
  timestamp: number; // ms
}

/** Audio note with full context */
export interface AudioNote {
  id: string;
  noteId: string;
  title: string;
  audio: AudioMetadata;
  transcription?: TranscriptionResult;
  isTranscribing: boolean;
  shareUrl?: string;
}

/** Hook return type for useAudioRecorder */
export interface UseAudioRecorderReturn {
  state: RecordingState;
  duration: RecordingDuration;
  waveform: WaveformDataPoint[];
  error: string | null;
  startRecording: (config?: Partial<AudioRecordingConfig>) => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<AudioMetadata | null>;
  cancelRecording: () => Promise<void>;
  isRecording: boolean;
  isPaused: boolean;
}

/** Hook return type for useAudioPlayer */
export interface UseAudioPlayerReturn {
  state: PlaybackState;
  progress: PlaybackProgress;
  speed: PlaybackSpeed;
  error: string | null;
  loadAudio: (uri: string, metadata?: Partial<AudioMetadata>) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  rewind: (seconds?: number) => Promise<void>;
  fastForward: (seconds?: number) => Promise<void>;
  setSpeed: (speed: PlaybackSpeed) => void;
  cycleSpeed: () => void;
  isPlaying: boolean;
  isPaused: boolean;
}

/** Hook return type for useAudioNote */
export interface UseAudioNoteReturn {
  audioNote: AudioNote | null;
  recorder: UseAudioRecorderReturn;
  player: UseAudioPlayerReturn;
  isTranscribing: boolean;
  transcriptionError: string | null;
  saveRecording: (noteId: string) => Promise<AudioNote>;
  deleteAudio: () => Promise<void>;
  transcribe: () => Promise<TranscriptionResult>;
  shareAudio: () => Promise<string>;
  restorePlaybackPosition: () => Promise<void>;
}
