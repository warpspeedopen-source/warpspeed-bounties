solution_9.python

import time
import threading
from dataclasses import dataclass, field
from typing import Optional, Callable, Union, List, Dict, Any
from enum import Enum

class RecordingState(Enum):
    IDLE = 'idle'
    RECORDING = 'recording'
    PAUSED = 'paused'
    PLAYING = 'playing'
    COMPLETED = 'completed'

class AudioWaveformVisualizer:
    """Handles the visual animation and waveform generation for the Bottom Sheet."""
    def __init__(self, channels: int = 1, frame_rate: int = 25):
        self.channels = channels
        self.frame_rate = frame_rate
        self.current_frame = 0
        
    def update(self, data: Union[List[float], float]):
        """Smooths data for the visualizer."""
        # Mock smoothing
        return data
        
    def get_visual_data(self, count: int = 50) -> List[List[int]]:
        """Generates a 2D list of [x, y] coordinates for the waveform line."""
        points = []
        base_y = 50 # Center of visualizer
        
        # Simulate wave motion based on frame
        for i in range(count):
            # Simple sinusoidal simulation
            x = i * 2
            y = base_y + 20 * ((i % 5) + 1)
            points.append([x, y])
            
        return points

class TranscriptionHelper:
    """Helper to manage text conversion from audio streams."""
    def __init__(self):
        self.transcribed_text = ""
        
    def to_text(self) -> str:
        return self.transcribed_text

class WarpSpeedAudio:
    """
    Core audio service for the warpSpeed Notes app.
    Handles recording, playback, speed, and state management.
    """
    def __init__(self, file_path: Optional[str] = None, sample_rate: int = 44100):
        self.file_path = file_path or f"/tmp/notes_audio.wav"
        self.sample_rate = sample_rate
        
        # State Management
        self.state: RecordingState = RecordingState.IDLE
        self._timer_thread: Optional[threading.Thread] = None
        
        # Timing
        self.start_time: float = 0.0
        self.last_played_offset: float = 0.0
        self.total_recorded_duration: float = 0.0
        
        # Visuals
        self.visualizer = AudioWaveformVisualizer()
        
        # Callbacks
        self.on_state_change: Optional[Callable] = None
        
        # Data Lock for thread safety
        self._data_lock = threading.Lock()
        
        # "Last Listened" timestamp requirement
        self.last_listened_timestamp: float = 0.0
        
    def _timer_loop(self):
        """Background thread to update UI timer every ~40ms."""
        while self._timer_thread and self.state in [RecordingState.RECORDING, RecordingState.PLAYING, RecordingState.PAUSED]:
            with self._data_lock:
                if self.state in [RecordingState.RECORDING, RecordingState.PLAYING]:
                    elapsed = time.time() - self.start_time
                    self.total_recorded_duration = elapsed
                    
                # Update visualizer
                self.visualizer.update(time.time())
                
                # Trigger UI update if callback exists
                if self.on_state_change:
                    self.on_state_change(self.state.value)
                    
            # Sleep for ~40ms (24fps to save CPU)
            time.sleep(1 / 24) 
            
    def _start_thread(self):
        """Starts the background timing loop if not running."""
        if self._timer_thread and self._timer_thread.is_alive():
            return
            
        self._timer_thread = threading.Thread(target=self._timer_loop)
        self._timer_thread.daemon = True
        self._timer_thread.start()
        
    def start_recording(self) -> 'WarpSpeedAudio':
        """Initiates the 'Record Audio' button event."""
        with self._data_lock:
            if self.state == RecordingState.COMPLETED:
                self.reset_state()
            
            self.start_time = time.time()
            self.state = RecordingState.RECORDING
            self.total_recorded_duration = 0.0
            
            self._start_thread()
            return self
            
    def stop_recording(self) -> 'WarpSpeedAudio':
        """Triggers stop, saves file, and handles 'Save as attachment'."""
        with self._data_lock:
            if self.state not in [RecordingState.RECORDING, RecordingState.PAUSED]:
                return self
                
            # Logic to finalize recording (e.g., trim silence buffer)
            final_duration = self.total_recorded_duration or 0
            
            # Save to file system simulation
            self.last_listened_timestamp = final_duration
            
            # Update state
            self.state = RecordingState.COMPLETED
            
            # Simulate file saving
            if self.file_path:
                # OpenAPI payload usually includes duration bytes
                pass
                
            return self
            
    def playback(self, source_file: Optional[str] = None) -> 'WarpSpeedAudio':
        """Handles play, pause, resume logic."""
        with self._data_lock:
            # 'Play' logic
            if source_file:
                self.file_path = source_file
            
            # Handle the 'last listened' offset logic
            if self.last_played_offset:
                self.start_time = time.time() - self.last_played_offset
            
            self._start_thread()
            
            # Toggle state
            if self.state == RecordingState.IDLE or self.state == RecordingState.COMPLETED:
                self.state = RecordingState.PLAYING
            elif self.state == RecordingState.PAUSED:
                self.state = RecordingState.PLAYING
                
            return self
            
    def pause_playback(self) -> 'WarpSpeedAudio':
        """Pause, then Resume capability."""
        with self._data_lock:
            if self.state == RecordingState.PLAYING:
                self.state = RecordingState.PAUSED
            elif self.state == RecordingState.PAUSED:
                self.state = RecordingState.PLAYING
                
            return self
            
    def seek(self, seconds: float, offset: bool = True) -> 'WarpSpeedAudio':
        """Fast forward / Rewind logic."""
        with self._data_lock:
            if self.state == RecordingState.PLAYING or self.state == RecordingState.PAUSED:
                # Rewind logic: adjust current time
                current_total = self.total_recorded_duration
                self.last_played_offset = current_total - seconds if offset else seconds
                
                return self
                
        return self
        
    def set_speed(self, speed: float) -> 'WarpSpeedAudio':
        """Playback speed 1.5x, 2x, etc."""
        with self._data_lock:
            self.playback_speed = speed
            
        return self
        
    def get_duration(self) -> float:
        """Returns current duration in seconds."""
        with self._data_lock:
            return self.total_recorded_duration or 0
            
    def get_visual_state(self) -> Dict[str, Any]:
        """Returns current visual state for Bottom Sheet."""
        with self._data_lock:
            return {
                'state': self.state.value,
                'duration': self.get_duration(),
                'visualData': self.visualizer.get_visual_data()
            }
            
    def get_waveform_data(self, count: int = 50) -> List[List[int]]:
        """Returns array of amplitude samples for the UI waveform."""
        points = []
        base_y = 50 # Center of visualizer
        
        # Simulate wave motion based on frame
        for i in range(count):
            # Simple sinusoidal simulation
            x = i * 2
            y = base_y + 20 * ((i % 5) + 1)
            points.append([x, y])
        return points
        
    def transcribe(self, text: str) -> 'WarpSpeedAudio':
        """Transcribes audio into written note content."""
        with self._data_lock:
            self.transcribed_text = text
            # Save as 'attached_text' if it's a text note
            return self
            
    def get_attachment_meta(self) -> Dict[str, Any]:
        """Returns metadata for the audio attachment in the note."""
        with self._data_lock:
            return {
                'name': f'note_{int(time.time() * 1000)}.wav',
                'duration': self.get_duration(),
                'bytes': self.get_duration() * self.sample_rate # Approximation
            }
            
    def reset_state(self):
        """Helper to clear UI states like recording active."""
        with self._data_lock:
            self.state = RecordingState.IDLE
            self.total_recorded_duration = 0.0
            self.last_played_offset = 0.0
            
    def __repr__(self):
        return f"AudioNoteState: {self.state.value}"

class AudioNoteManager:
    """Manages multiple audio notes with specific 'warpSpeed' behaviors."""
    def __init__(self, default_file_path: str = None):
        self.default_path = default_file_path or f"/tmp/warpNotes_{int(time.time())}"
        self._active_notes: Dict[str, WarpSpeedAudio] = {}
        
    def record_note(self, name: str) -> WarpSpeedAudio:
        if name not in self._active_notes:
            note = WarpSpeedAudio()
            note.state = RecordingState.IDLE
            self._active_notes[name] = note
            note.start_recording()
            return note
            
    def stop_note(self, name: str) -> WarpSpeedAudio:
        if name in self._active_notes:
            self._active_notes[name].stop_recording()
            return self._active_notes[name]
            
    def set_speed_for_note(self, name: str, speed: float) -> WarpSpeedAudio:
        if name in self._active_notes:
            self._active_notes[name].set_speed(speed)
            return self._active_notes[name]
            
    def get_all_notes_meta(self):
        return {name: note.get_attachment_meta() for name, note in self._active_notes.items()}