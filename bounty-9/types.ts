// ─── Core domain types ────────────────────────────────────────────────

/** Soft-delete / archive status */
export type ArchiveStatus = 'active' | 'archived';

/** Supported audio MIME types */
export type AudioMimeType = 'audio/webm' | 'audio/wav' | 'audio/mp4';

/** Recording lifecycle state on device */
export type RecordingStatus =
  | 'idle'
  | 'permission-pending'
  | 'permission-denied'
  | 'ready'
  | 'recording'
  | 'stopped'
  | 'uploading'
  | 'uploaded'
  | 'error';

/** Playback lifecycle state */
export type PlaybackStatus =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'finished'
  | 'error';

/** Transcription lifecycle state */
export type TranscriptionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

// ─── AudioNote ────────────────────────────────────────────────────────

/** A persisted audio note record (matches D1 row) */
export interface AudioNote {
  /** UUID v7 primary key */
  id: string;
  /** User-facing title (auto-generated if null) */
  title: string | null;
  /** Recording length in milliseconds */
  durationMs: number;
  /** R2 object key (e.g. `audio/<uuid>.webm`) */
  fileKey: string;
  /** File size in bytes */
  fileSize: number;
  /** MIME type of the audio file */
  mimeType: AudioMimeType;
  /** ISO-8601 creation timestamp */
  createdAt: string;
  /** ISO-8601 last-updated timestamp */
  updatedAt: string;
  /** Soft-delete flag */
  archived: boolean;
}

// ─── Recording ────────────────────────────────────────────────────────

/** Client-side recording state emitted by AudioRecorder */
export interface RecordingState {
  /** Current lifecycle status */
  status: RecordingStatus;
  /** Duration of the current recording session (ms) */
  durationMs: number;
  /** Local file URI after recording stops */
  fileUri: string | null;
  /** File size in bytes (available after stop) */
  fileSize: number | null;
  /** Error message when status === 'error' */
  error: string | null;
}

/** Metadata collected before/after a recording session */
export interface RecordingMetadata {
  /** User-provided or auto-generated title */
  title?: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** MIME type of the recorded file */
  mimeType: AudioMimeType;
  /** File size in bytes */
  fileSize: number;
}

// ─── Transcription ────────────────────────────────────────────────────

/** A single segment (word or phrase group) within a transcript */
export interface TranscriptSegment {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Transcribed text for this segment */
  text: string;
  /** Per-segment confidence (0–1) */
  confidence?: number;
}

/** Full transcription result */
export interface Transcription {
  /** UUID v7 primary key */
  id: string;
  /** Parent audio note ID */
  noteId: string;
  /** Full concatenated transcript text */
  text: string;
  /** Segmented transcription with timing data */
  segments: TranscriptSegment[];
  /** Whisper model variant used */
  model: string;
  /** Overall confidence (0–1) */
  confidence: number;
  /** Detected language code (BCP-47) */
  language: string;
  /** Current processing status */
  status: TranscriptionStatus;
  /** ISO-8601 creation timestamp */
  createdAt: string;
}

// ─── Playback ─────────────────────────────────────────────────────────

/** Client-side playback state emitted by AudioPlayer */
export interface PlaybackState {
  /** Current lifecycle status */
  status: PlaybackStatus;
  /** Current playback position in milliseconds */
  positionMs: number;
  /** Total duration in milliseconds (0 until loaded) */
  durationMs: number;
  /** Volume level 0.0–1.0 */
  volume: number;
  /** Whether the audio is muted */
  isMuted: boolean;
  /** Playback rate (0.5, 1.0, 1.5, 2.0) */
  rate: number;
  /** Error message when status === 'error' */
  error: string | null;
}

// ─── API DTOs ─────────────────────────────────────────────────────────

/** Response from GET /notes */
export interface ListNotesResponse {
  items: AudioNote[];
  cursor: string | null;
  total: number;
}

/** Payload for POST /notes */
export interface CreateNoteRequest {
  title?: string;
  durationMs: number;
  mimeType: AudioMimeType;
  fileSize: number;
}

/** Response from POST /notes/upload */
export interface UploadResponse {
  note: AudioNote;
  /** Pre-signed URL for uploading the audio file */
  uploadUrl: string;
  /** Pre-signed URL expiration in seconds */
  expiresIn: number;
}

/** Response from POST /notes/:id/transcribe */
export interface TranscribeResponse {
  transcription: Transcription;
}

/** Response from GET /notes/:id/transcription */
export interface GetTranscriptionResponse {
  transcription: Transcription | null;
}

// ─── Events ───────────────────────────────────────────────────────────

/** Events emitted over the transcription WebSocket */
export type TranscriptionEvent =
  | { type: 'transcription.started'; noteId: string }
  | { type: 'transcription.progress'; noteId: string; progress: number }
  | { type: 'transcription.completed'; noteId: string; transcription: Transcription }
  | { type: 'transcription.failed'; noteId: string; error: string };
