import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  TouchableWithoutFeedback,
  GestureResponderEvent,
} from 'react-native';
import { audioService, AudioNote, PlayerState } from '../services/AudioService';

const { width } = Dimensions.get('window');

// Helper to format duration in MM:SS
const formatTimeShort = (timeInSeconds: number): string => {
  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Helper to format bytes to human readable sizes
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

export const AudioNotePlayer: React.FC = () => {
  const [notes, setNotes] = useState<AudioNote[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentNoteId: null,
    currentTime: 0,
    playbackSpeed: 1.0,
    rememberedPositions: {},
  });

  const [seekBarWidth, setSeekBarWidth] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Subscribe to lists and player state
  useEffect(() => {
    const unsubNotes = audioService.subscribeToNotes((currentNotes) => {
      setNotes(currentNotes);
    });

    const unsubPlayer = audioService.subscribeToPlayer((state) => {
      setPlayerState(state);
    });

    return () => {
      unsubNotes();
      unsubPlayer();
    };
  }, []);

  const activeNote = notes.find(n => n.id === playerState.currentNoteId) || null;

  const handlePlayPause = (noteId: string) => {
    if (playerState.isPlaying && playerState.currentNoteId === noteId) {
      audioService.pausePlayback();
    } else {
      audioService.playNote(noteId);
    }
  };

  const handleStop = () => {
    audioService.stopPlayback();
  };

  const handleSpeedChange = (speed: number) => {
    audioService.setPlaybackSpeed(speed);
  };

  const handleSeek = (event: GestureResponderEvent) => {
    if (!activeNote || seekBarWidth === 0) return;
    
    // Capture location x of tap
    const clickX = event.nativeEvent.locationX;
    const clickRatio = Math.max(0, Math.min(1, clickX / seekBarWidth));
    const seekTime = clickRatio * activeNote.duration;
    
    audioService.seekTo(seekTime);
  };

  const handleDelete = (id: string) => {
    audioService.deleteNote(id);
  };

  // Render static waveform of current playing note as an interactive progress bar
  const renderInteractiveWaveform = () => {
    if (!activeNote) return null;

    const progressRatio = activeNote.duration > 0 ? playerState.currentTime / activeNote.duration : 0;
    const waveData = activeNote.waveform;
    const totalBars = waveData.length;

    return (
      <TouchableWithoutFeedback onPress={handleSeek}>
        <View 
          style={styles.waveformProgressContainer}
          onLayout={(e) => setSeekBarWidth(e.nativeEvent.layout.width)}
        >
          {waveData.map((amplitude, index) => {
            const barProgress = index / totalBars;
            const isPlayed = barProgress <= progressRatio;
            const barHeight = Math.max(6, amplitude * 64); // normalized height up to 64px
            
            // Played part is Hot Magenta or Green, Unplayed is dim blue-gray
            const barColor = isPlayed 
              ? playerState.isPlaying ? '#ff007f' : '#00f0ff'
              : '#1a2238';

            return (
              <View
                key={index}
                style={[
                  styles.waveformProgressBar,
                  {
                    height: barHeight,
                    backgroundColor: barColor,
                    shadowColor: isPlayed ? barColor : 'transparent',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                  }
                ]}
              />
            );
          })}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <View style={styles.container}>
      {/* Decal Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CYBER_DECK // AUDIO_LOGS</Text>
        <View style={styles.scannerLine} />
      </View>

      {/* CORE PLAYER PANEL (Active deck overlay) */}
      {activeNote ? (
        <View style={styles.activeDeck}>
          <View style={styles.activeDeckCornerDecal} />
          
          <View style={styles.deckHeader}>
            <View style={styles.laserLabel}>
              <View style={styles.laserDot} />
              <Text style={styles.laserText}>ACTIVE TRANSMISSION</Text>
            </View>
            <Text style={styles.deckCodeText}>{activeNote.id.toUpperCase()}</Text>
          </View>

          <Text numberOfLines={1} style={styles.activeTitle}>
            {activeNote.title}
          </Text>

          {/* Interactive waveform seek progress */}
          {renderInteractiveWaveform()}

          {/* Seek progress timestamps */}
          <View style={styles.deckTimesRow}>
            <Text style={styles.timeTicker}>{formatTimeShort(playerState.currentTime)}</Text>
            <Text style={styles.timeDivider}>//</Text>
            <Text style={styles.timeDuration}>{formatTimeShort(activeNote.duration)}</Text>
          </View>

          {/* Control Triggers Deck */}
          <View style={styles.deckControlsRow}>
            {/* SPEED BOOSTERS */}
            <View style={styles.speedBoosterContainer}>
              <Text style={styles.controlSubheader}>CLOCK_SPEED</Text>
              <View style={styles.speedRow}>
                {([1.0, 1.5, 2.0] as const).map((speed) => {
                  const isActive = playerState.playbackSpeed === speed;
                  return (
                    <TouchableOpacity
                      key={speed}
                      style={[styles.speedBtn, isActive && styles.speedBtnActive]}
                      onPress={() => handleSpeedChange(speed)}
                    >
                      <Text style={[styles.speedBtnText, isActive && styles.speedBtnTextActive]}>
                        {speed.toFixed(1)}x
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* AUDIO ACTION TRIGGERS */}
            <View style={styles.audioTriggersContainer}>
              <TouchableOpacity
                style={styles.deckStopBtn}
                onPress={handleStop}
                activeOpacity={0.7}
              >
                <View style={styles.deckStopInner} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deckPlayPauseBtn,
                  playerState.isPlaying && styles.deckPlayPauseBtnActive
                ]}
                onPress={() => handlePlayPause(activeNote.id)}
                activeOpacity={0.7}
              >
                {playerState.isPlaying ? (
                  <View style={styles.deckPauseIconContainer}>
                    <View style={styles.deckPauseBar} />
                    <View style={styles.deckPauseBar} />
                  </View>
                ) : (
                  <Text style={styles.deckPlayIcon}>▶</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noActiveDeck}>
          <Text style={styles.noActiveDeckText}>NO COGNITIVE LOG SELECTED</Text>
          <Text style={styles.noActiveDeckSubtext}>LOAD TRANSCEIVER OR RECORD NEW STREAM</Text>
        </View>
      )}

      {/* RECORDINGS ARCHIVE DATABASE */}
      <Text style={styles.archiveHeader}>ARCHIVE_CORES</Text>
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.archiveScroll}
        contentContainerStyle={styles.archiveContent}
        showsVerticalScrollIndicator={false}
      >
        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>DATABASE CLEAN // NO CORES</Text>
          </View>
        ) : (
          notes.map((note) => {
            const isSelected = playerState.currentNoteId === note.id;
            const isPlayingThis = isSelected && playerState.isPlaying;
            const hasSavedProgress = (playerState.rememberedPositions[note.id] || 0) > 0.5 && 
              (playerState.rememberedPositions[note.id] < note.duration - 0.5);

            return (
              <View 
                key={note.id} 
                style={[
                  styles.noteCard,
                  isSelected && styles.noteCardSelected
                ]}
              >
                {/* Border glowing highlight line */}
                {isSelected && <View style={styles.cardSelectedGlow} />}
                
                <View style={styles.cardInfoCol}>
                  <Text numberOfLines={1} style={[
                    styles.cardTitle,
                    isSelected && styles.cardTitleSelected
                  ]}>
                    {note.title}
                  </Text>
                  
                  <View style={styles.cardDetailsRow}>
                    <Text style={styles.cardMetaText}>
                      {formatTimeShort(note.duration)}
                    </Text>
                    <Text style={styles.cardMetaDivider}>|</Text>
                    <Text style={styles.cardMetaText}>
                      {formatBytes(note.sizeBytes)}
                    </Text>
                    {hasSavedProgress && (
                      <>
                        <Text style={styles.cardMetaDivider}>|</Text>
                        <Text style={styles.cardMetaSavedProgress}>
                          RESUME @ {formatTimeShort(playerState.rememberedPositions[note.id] || 0)}
                        </Text>
                      </>
                    )}
                  </View>
                  <Text style={styles.cardDateText}>
                    REC: {new Date(note.createdAt).toLocaleString()}
                  </Text>
                </View>

                {/* Card Controls */}
                <View style={styles.cardActionsCol}>
                  {/* PLAY ICON TOGGLE */}
                  <TouchableOpacity
                    style={[
                      styles.cardPlayBtn,
                      isPlayingThis && styles.cardPlayBtnActive
                    ]}
                    onPress={() => handlePlayPause(note.id)}
                    activeOpacity={0.7}
                  >
                    {isPlayingThis ? (
                      <View style={styles.smallPauseIcon}>
                        <View style={styles.smallPauseBar} />
                        <View style={styles.smallPauseBar} />
                      </View>
                    ) : (
                      <Text style={styles.smallPlayText}>▶</Text>
                    )}
                  </TouchableOpacity>

                  {/* TRASH / WIPE TRIGGER */}
                  <TouchableOpacity
                    style={styles.cardDeleteBtn}
                    onPress={() => handleDelete(note.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteText}>WIPE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#07080e',
    borderColor: '#1f2438',
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  header: {
    marginBottom: 16,
    position: 'relative',
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
    color: '#00f0ff',
    letterSpacing: 2,
  },
  scannerLine: {
    height: 1,
    backgroundColor: '#1f2438',
    marginTop: 8,
  },
  // Active Playback Deck
  activeDeck: {
    backgroundColor: '#0a0d16',
    borderWidth: 1.5,
    borderColor: '#ff007f',
    borderRadius: 10,
    padding: 16,
    position: 'relative',
    shadowColor: '#ff007f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 3,
  },
  activeDeckCornerDecal: {
    position: 'absolute',
    top: -2,
    right: 15,
    width: 25,
    height: 3,
    backgroundColor: '#ff007f',
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  laserLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  laserDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff007f',
    marginRight: 6,
  },
  laserText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: 'bold',
    fontSize: 9,
    color: '#ff007f',
    letterSpacing: 1.5,
  },
  deckCodeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    color: '#4e5a78',
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  // Static waveform seek progress styling
  waveformProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    width: '100%',
    backgroundColor: '#05070a',
    borderRadius: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#151b2e',
    marginVertical: 4,
  },
  waveformProgressBar: {
    flex: 1,
    marginHorizontal: 0.8,
    borderRadius: 1,
  },
  // Timing
  deckTimesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  timeTicker: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00f0ff',
    textShadowColor: 'rgba(0, 240, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  timeDivider: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 12,
    color: '#39435d',
    marginHorizontal: 8,
  },
  timeDuration: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 14,
    color: '#8f9bbc',
  },
  // Deck Controls
  deckControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderColor: '#151b2e',
    paddingTop: 12,
  },
  speedBoosterContainer: {
    flex: 1,
  },
  controlSubheader: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#4e5a78',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  speedRow: {
    flexDirection: 'row',
  },
  speedBtn: {
    backgroundColor: '#0f1322',
    borderWidth: 1,
    borderColor: '#242d4a',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginRight: 6,
  },
  speedBtnActive: {
    borderColor: '#00f0ff',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  speedBtnText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8f9bbc',
  },
  speedBtnTextActive: {
    color: '#00f0ff',
  },
  audioTriggersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deckStopBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#ff3131',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#0a0d16',
  },
  deckStopInner: {
    width: 12,
    height: 12,
    backgroundColor: '#ff3131',
    borderRadius: 1,
  },
  deckPlayPauseBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#00f0ff',
    backgroundColor: '#0a0d16',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  deckPlayPauseBtnActive: {
    borderColor: '#ff007f',
    shadowColor: '#ff007f',
  },
  deckPlayIcon: {
    fontSize: 16,
    color: '#00f0ff',
    marginLeft: 3,
  },
  deckPauseIconContainer: {
    flexDirection: 'row',
    width: 12,
    height: 12,
    justifyContent: 'space-between',
  },
  deckPauseBar: {
    width: 3.5,
    height: '100%',
    backgroundColor: '#ff007f',
    borderRadius: 1,
  },
  // Standby/No Active
  noActiveDeck: {
    height: 160,
    backgroundColor: '#05070a',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#111726',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noActiveDeckText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#4e5a78',
    letterSpacing: 2,
    marginBottom: 6,
  },
  noActiveDeckSubtext: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    color: '#303a50',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  // Archives List
  archiveHeader: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#5c698a',
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 12,
  },
  archiveScroll: {
    maxHeight: 280,
  },
  archiveContent: {
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderWidth: 1,
    borderColor: '#111726',
    borderRadius: 8,
    backgroundColor: '#080a12',
  },
  emptyText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    color: '#3c4761',
    letterSpacing: 1.5,
  },
  noteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0d16',
    borderColor: '#151c2e',
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  noteCardSelected: {
    borderColor: '#00f0ff',
  },
  cardSelectedGlow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: '#00f0ff',
  },
  cardInfoCol: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#8f9bbc',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardTitleSelected: {
    color: '#ffffff',
  },
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardMetaText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    color: '#5c698a',
  },
  cardMetaDivider: {
    fontSize: 10,
    color: '#2a334d',
    marginHorizontal: 6,
  },
  cardMetaSavedProgress: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    color: '#ffae00',
    fontWeight: 'bold',
  },
  cardDateText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    color: '#3c4761',
    marginTop: 2,
  },
  cardActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cardPlayBtnActive: {
    borderColor: '#ff007f',
    backgroundColor: 'rgba(255, 0, 127, 0.05)',
  },
  smallPlayText: {
    fontSize: 11,
    color: '#00f0ff',
    marginLeft: 1.5,
  },
  smallPauseIcon: {
    flexDirection: 'row',
    width: 8,
    height: 8,
    justifyContent: 'space-between',
  },
  smallPauseBar: {
    width: 2.5,
    height: '100%',
    backgroundColor: '#ff007f',
    borderRadius: 0.5,
  },
  cardDeleteBtn: {
    borderColor: '#ff3131',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 49, 49, 0.02)',
  },
  deleteText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ff3131',
  },
});
