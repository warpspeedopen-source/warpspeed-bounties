export interface AudioRecording {
  id: string;
  uri: string;
  durationMs: number;
  createdAt: number;
  status: 'recording' | 'paused' | 'stopped' | 'saved';
}

export interface AudioNote {
  id: string;
  noteId: string;
  recording: AudioRecording;
  transcription?: string;
  lastPlayedPositionMs?: number;
}
