/**
 * AudioService.ts
 * Premium Cyberpunk Audio Note Simulator Service
 * Handles recording simulation, playback state management, seek position storage, and pub/sub updates.
 */

export interface AudioNote {
  id: string;
  title: string;
  duration: number; // in seconds
  uri: string;
  createdAt: string;
  waveform: number[]; // Array of amplitudes (0.0 - 1.0) for visualization
  sizeBytes: number;
}

export interface RecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // in seconds
  waveform: number[]; // real-time waveform bars
  currentAmplitude: number; // 0.0 - 1.0 for real-time pulsing UI
}

export interface PlayerState {
  isPlaying: boolean;
  currentNoteId: string | null;
  currentTime: number; // in seconds
  playbackSpeed: number; // 1.0, 1.5, 2.0
  rememberedPositions: Record<string, number>; // Maps noteId -> last seek position
}

type RecorderCallback = (state: RecorderState) => void;
type PlayerCallback = (state: PlayerState) => void;
type NotesListCallback = (notes: AudioNote[]) => void;

class AudioService {
  private notes: AudioNote[] = [];
  private recorderState: RecorderState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    waveform: [],
    currentAmplitude: 0,
  };
  private playerState: PlayerState = {
    isPlaying: false,
    currentNoteId: null,
    currentTime: 0,
    playbackSpeed: 1.0,
    rememberedPositions: {},
  };

  // Subscriptions
  private recorderListeners = new Set<RecorderCallback>();
  private playerListeners = new Set<PlayerCallback>();
  private notesListeners = new Set<NotesListCallback>();

  // Timers
  private recordingInterval: any = null;
  private playbackInterval: any = null;

  constructor() {
    // Seed some premium cyberpunk style pre-recorded notes
    this.notes = [
      {
        id: 'cyber-note-1',
        title: 'Matrix Breach Logs - Sector 7',
        duration: 48,
        uri: 'file://simulated/notes/cyber-note-1.mp3',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
        waveform: this.generateDummyWaveform(60, 0.2, 0.8),
        sizeBytes: 1543200,
      },
      {
        id: 'cyber-note-2',
        title: 'AI Neural Core Synapse Audit',
        duration: 125,
        uri: 'file://simulated/notes/cyber-note-2.mp3',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
        waveform: this.generateDummyWaveform(80, 0.15, 0.95),
        sizeBytes: 4012000,
      },
      {
        id: 'cyber-note-3',
        title: 'Neo-Tokyo Neon Grid Flux',
        duration: 15,
        uri: 'file://simulated/notes/cyber-note-3.mp3',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
        waveform: this.generateDummyWaveform(40, 0.3, 0.7),
        sizeBytes: 480000,
      }
    ];

    // Seed initial remembered positions
    this.playerState.rememberedPositions = {
      'cyber-note-1': 12.4,
      'cyber-note-2': 45.0,
    };
  }

  // ==========================================
  // NOTE MANAGEMENT
  // ==========================================

  public getNotes(): AudioNote[] {
    return [...this.notes];
  }

  public deleteNote(id: string): void {
    if (this.playerState.currentNoteId === id) {
      this.stopPlayback();
    }
    this.notes = this.notes.filter(n => n.id !== id);
    // clean up remembered position
    const newPositions = { ...this.playerState.rememberedPositions };
    delete newPositions[id];
    this.playerState.rememberedPositions = newPositions;

    this.notifyNotesListeners();
    this.notifyPlayerListeners();
  }

  // ==========================================
  // SUBSCRIPTION & PUB/SUB
  // ==========================================

  public subscribeToRecorder(callback: RecorderCallback): () => void {
    this.recorderListeners.add(callback);
    callback({ ...this.recorderState });
    return () => this.recorderListeners.delete(callback);
  }

  public subscribeToPlayer(callback: PlayerCallback): () => void {
    this.playerListeners.add(callback);
    callback({ ...this.playerState });
    return () => this.playerListeners.delete(callback);
  }

  public subscribeToNotes(callback: NotesListCallback): () => void {
    this.notesListeners.add(callback);
    callback([...this.notes]);
    return () => this.notesListeners.delete(callback);
  }

  private notifyRecorderListeners() {
    const state = { ...this.recorderState, waveform: [...this.recorderState.waveform] };
    this.recorderListeners.forEach(cb => cb(state));
  }

  private notifyPlayerListeners() {
    const state = { ...this.playerState, rememberedPositions: { ...this.playerState.rememberedPositions } };
    this.playerListeners.forEach(cb => cb(state));
  }

  private notifyNotesListeners() {
    const notesCopy = [...this.notes];
    this.notesListeners.forEach(cb => cb(notesCopy));
  }

  // ==========================================
  // RECORDER ACTION METHODS
  // ==========================================

  public startRecording(): void {
    if (this.recorderState.isRecording && !this.recorderState.isPaused) return;

    // If player is playing, pause it to prioritize recording
    if (this.playerState.isPlaying) {
      this.pausePlayback();
    }

    if (this.recorderState.isPaused) {
      // Resume
      this.recorderState.isPaused = false;
    } else {
      // Start fresh
      this.recorderState = {
        isRecording: true,
        isPaused: false,
        duration: 0,
        waveform: [],
        currentAmplitude: 0,
      };
    }

    this.recorderState.isRecording = true;
    this.notifyRecorderListeners();

    // Start simulation interval (every 100ms)
    this.clearRecordingInterval();
    this.recordingInterval = setInterval(() => {
      if (this.recorderState.isPaused) return;

      this.recorderState.duration += 0.1;

      // Simulate a live amplitude bar (value between 0.05 and 1.0)
      // Uses sine-wave modulation mixed with random noise for realistic visual waveforms
      const time = this.recorderState.duration;
      const baseAmplitude = 0.4 + 0.3 * Math.sin(time * 2.5) + 0.15 * Math.sin(time * 7);
      const randomNoise = (Math.random() - 0.5) * 0.2;
      const amplitude = Math.max(0.05, Math.min(1.0, baseAmplitude + randomNoise));

      this.recorderState.currentAmplitude = amplitude;
      
      // Keep only last 80 visual bars for rolling wave in recorder
      this.recorderState.waveform.push(amplitude);
      if (this.recorderState.waveform.length > 80) {
        this.recorderState.waveform.shift();
      }

      this.notifyRecorderListeners();
    }, 100);
  }

  public pauseRecording(): void {
    if (!this.recorderState.isRecording || this.recorderState.isPaused) return;
    
    this.recorderState.isPaused = true;
    this.recorderState.currentAmplitude = 0;
    this.notifyRecorderListeners();
  }

  public stopRecording(customTitle?: string): AudioNote | null {
    if (!this.recorderState.isRecording) return null;

    this.clearRecordingInterval();

    const duration = Math.round(this.recorderState.duration);
    
    // Discard extremely short recordings (< 1 sec)
    if (duration < 1) {
      this.cancelRecording();
      return null;
    }

    // Capture waveform
    let finalWaveform = [...this.recorderState.waveform];
    
    // Ensure we have a decent number of bars for rendering (e.g. at least 40)
    if (finalWaveform.length < 40) {
      const paddingNeeded = 40 - finalWaveform.length;
      for (let i = 0; i < paddingNeeded; i++) {
        finalWaveform.push(0.05 + Math.random() * 0.1);
      }
    }

    const noteId = `note-${Date.now()}`;
    const newNote: AudioNote = {
      id: noteId,
      title: customTitle || `Cyber Note #${this.notes.length + 1}`,
      duration: duration,
      uri: `file://simulated/notes/${noteId}.mp3`,
      createdAt: new Date().toISOString(),
      waveform: finalWaveform,
      sizeBytes: duration * 32000, // Simulated size (e.g. ~32 KB/sec)
    };

    // Reset recorder state
    this.recorderState = {
      isRecording: false,
      isPaused: false,
      duration: 0,
      waveform: [],
      currentAmplitude: 0,
    };

    this.notes.unshift(newNote); // Add to beginning
    this.notifyRecorderListeners();
    this.notifyNotesListeners();

    return newNote;
  }

  public cancelRecording(): void {
    this.clearRecordingInterval();
    
    this.recorderState = {
      isRecording: false,
      isPaused: false,
      duration: 0,
      waveform: [],
      currentAmplitude: 0,
    };

    this.notifyRecorderListeners();
  }

  // ==========================================
  // PLAYER ACTION METHODS
  // ==========================================

  public playNote(noteId: string): void {
    // If it's already playing, and it is the same note, no action needed
    if (this.playerState.isPlaying && this.playerState.currentNoteId === noteId) return;

    // Find the note
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return;

    // Stop existing playback timer
    this.clearPlaybackInterval();

    // If changing notes, pause recording if recording is active
    if (this.recorderState.isRecording) {
      this.pauseRecording();
    }

    const isSameNote = this.playerState.currentNoteId === noteId;
    let resumeTime = 0;

    if (isSameNote) {
      resumeTime = this.playerState.currentTime;
    } else {
      // Different note. Retrieve remembered playback position, default to 0
      resumeTime = this.playerState.rememberedPositions[noteId] || 0;
      // If position was already at the end, reset to 0
      if (resumeTime >= note.duration - 0.1) {
        resumeTime = 0;
      }
    }

    this.playerState.currentNoteId = noteId;
    this.playerState.isPlaying = true;
    this.playerState.currentTime = resumeTime;
    this.notifyPlayerListeners();

    this.startPlaybackTimer(note);
  }

  public pausePlayback(): void {
    if (!this.playerState.isPlaying || !this.playerState.currentNoteId) return;

    this.clearPlaybackInterval();
    this.playerState.isPlaying = false;

    // Remember the position
    const currentNoteId = this.playerState.currentNoteId;
    this.playerState.rememberedPositions = {
      ...this.playerState.rememberedPositions,
      [currentNoteId]: this.playerState.currentTime
    };

    this.notifyPlayerListeners();
  }

  public stopPlayback(): void {
    this.clearPlaybackInterval();
    
    if (this.playerState.currentNoteId) {
      const currentNoteId = this.playerState.currentNoteId;
      this.playerState.rememberedPositions = {
        ...this.playerState.rememberedPositions,
        [currentNoteId]: 0 // Reset remembered position to 0 upon clean stop
      };
    }

    this.playerState.isPlaying = false;
    this.playerState.currentNoteId = null;
    this.playerState.currentTime = 0;
    this.notifyPlayerListeners();
  }

  public seekTo(positionSeconds: number): void {
    if (!this.playerState.currentNoteId) return;
    
    const note = this.notes.find(n => n.id === this.playerState.currentNoteId);
    if (!note) return;

    // Clamp between 0 and duration
    const clampedPos = Math.max(0, Math.min(note.duration, positionSeconds));
    
    this.playerState.currentTime = clampedPos;
    
    // Save position
    this.playerState.rememberedPositions = {
      ...this.playerState.rememberedPositions,
      [note.id]: clampedPos
    };

    this.notifyPlayerListeners();

    // If playing, we need to restart/adjust playback interval timer
    if (this.playerState.isPlaying) {
      this.clearPlaybackInterval();
      this.startPlaybackTimer(note);
    }
  }

  public setPlaybackSpeed(speed: number): void {
    const validSpeed = speed === 1.5 || speed === 2.0 ? speed : 1.0;
    this.playerState.playbackSpeed = validSpeed;
    this.notifyPlayerListeners();

    // If currently playing, we must adjust the interval clock rate
    if (this.playerState.isPlaying && this.playerState.currentNoteId) {
      const note = this.notes.find(n => n.id === this.playerState.currentNoteId);
      if (note) {
        this.clearPlaybackInterval();
        this.startPlaybackTimer(note);
      }
    }
  }

  // ==========================================
  // HELPERS & INTERNAL METHODS
  // ==========================================

  private startPlaybackTimer(note: AudioNote): void {
    // Trigger tick every 100ms
    const intervalTimeMs = 100;
    // Every tick advances currentTime by: intervalTime * playbackSpeed
    const timeStepSeconds = (intervalTimeMs / 1000) * this.playerState.playbackSpeed;

    this.playbackInterval = setInterval(() => {
      const nextTime = this.playerState.currentTime + timeStepSeconds;
      
      if (nextTime >= note.duration) {
        // Playback finished!
        this.playerState.currentTime = note.duration;
        this.pausePlayback();
        this.seekTo(0); // Auto reset to 0
      } else {
        this.playerState.currentTime = nextTime;
        // Periodically update remembered position to avoid losing state
        this.playerState.rememberedPositions[note.id] = nextTime;
        this.notifyPlayerListeners();
      }
    }, intervalTimeMs);
  }

  private clearRecordingInterval() {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
  }

  private clearPlaybackInterval() {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  private generateDummyWaveform(length: number, min: number, max: number): number[] {
    const wave: number[] = [];
    for (let i = 0; i < length; i++) {
      // Sinusoidal structure + some random spikes
      const phase = (i / length) * Math.PI * 4;
      const base = min + (max - min) * (0.5 + 0.3 * Math.sin(phase) + 0.2 * Math.sin(phase * 3.5));
      const noise = (Math.random() - 0.5) * 0.15;
      wave.push(Math.max(min, Math.min(max, base + noise)));
    }
    return wave;
  }
}

// Export singleton instance for app-wide state consistency
export const audioService = new AudioService();
