import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { audioService, RecorderState } from '../services/AudioService';

const { width } = Dimensions.get('window');

// Helper to format duration in MM:SS.S
const formatTime = (timeInSeconds: number): string => {
  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);
  const tenths = Math.floor((timeInSeconds % 1) * 10);
  
  const minsStr = mins.toString().padStart(2, '0');
  const secsStr = secs.toString().padStart(2, '0');
  
  return `${minsStr}:${secsStr}.${tenths}`;
};

export const AudioNoteRecorder: React.FC = () => {
  const [recorderState, setRecorderState] = useState<RecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    waveform: [],
    currentAmplitude: 0,
  });
  
  const [customTitle, setCustomTitle] = useState('');
  const [isSavedAlertVisible, setIsSavedAlertVisible] = useState(false);
  const [lastSavedName, setLastSavedName] = useState('');

  // Animation values for premium cyberpunk UI effects
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideDownAnim = useRef(new Animated.Value(-100)).current;

  // Subscribe to AudioService recording state
  useEffect(() => {
    const unsubscribe = audioService.subscribeToRecorder((state) => {
      setRecorderState(state);
    });
    return () => unsubscribe();
  }, []);

  // Pulsing animation for active recording button and REC indicator
  useEffect(() => {
    let pulse: Animated.CompositeAnimation | null = null;
    
    if (recorderState.isRecording && !recorderState.isPaused) {
      pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (pulse) pulse.stop();
    };
  }, [recorderState.isRecording, recorderState.isPaused]);

  // Alert slide down animation
  const showSavedAlert = (name: string) => {
    setLastSavedName(name);
    setIsSavedAlertVisible(true);
    Animated.sequence([
      Animated.timing(slideDownAnim, {
        toValue: 20,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(slideDownAnim, {
        toValue: -120,
        duration: 350,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      })
    ]).start(() => setIsSavedAlertVisible(false));
  };

  const handleStart = () => {
    audioService.startRecording();
    setCustomTitle('');
  };

  const handlePause = () => {
    audioService.pauseRecording();
  };

  const handleResume = () => {
    audioService.startRecording();
  };

  const handleStop = () => {
    const defaultTitle = customTitle.trim() || `CYBER-LOG-${new Date().toLocaleTimeString()}`;
    const savedNote = audioService.stopRecording(defaultTitle);
    if (savedNote) {
      showSavedAlert(savedNote.title);
    }
    setCustomTitle('');
  };

  const handleCancel = () => {
    audioService.cancelRecording();
    setCustomTitle('');
  };

  // Render horizontal bar waveform
  const renderWaveform = () => {
    // Generate empty bars to fill up when starting
    const barCount = 45;
    const paddedWaveform = [...recorderState.waveform];
    while (paddedWaveform.length < barCount) {
      // Unshifted (added to front) to push newer entries to the right side
      paddedWaveform.unshift(0.05);
    }

    // Capture subset of last barCount bars
    const displayWaveform = paddedWaveform.slice(-barCount);

    return (
      <View style={styles.waveformContainer}>
        {displayWaveform.map((amplitude, index) => {
          // Normalize height between minHeight and maxHeight
          const barHeight = Math.max(4, amplitude * 80);
          // Cyberpunk color shifting: active/inactive or pulse-based tinting
          const isLatest = index >= barCount - 5;
          const barColor = recorderState.isPaused
            ? '#ffae00' // Gold/Amber when paused
            : isLatest 
              ? '#ff007f' // Hot Magenta for leading/new voice signals
              : '#00f0ff'; // Cyber Cyan for normal signal stream

          return (
            <View
              key={index}
              style={[
                styles.waveBar,
                {
                  height: barHeight,
                  backgroundColor: barColor,
                  opacity: recorderState.isPaused ? 0.4 : 0.4 + (amplitude * 0.6),
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.outerContainer}
    >
      {/* Premium Dynamic Alert Toast */}
      {isSavedAlertVisible && (
        <Animated.View style={[styles.savedAlert, { transform: [{ translateY: slideDownAnim }] }]}>
          <View style={styles.alertHeader}>
            <View style={styles.alertHeaderDot} />
            <Text style={styles.alertHeaderText}>SYSTEM TELEMETRY</Text>
          </View>
          <Text style={styles.alertBodyText}>AUDIO LOG SAVED AND ARCHIVED</Text>
          <Text style={styles.alertNoteName}>{lastSavedName}</Text>
        </Animated.View>
      )}

      <View style={styles.container}>
        {/* Cyberpunk Decorative Decals */}
        <View style={styles.topDecalContainer}>
          <Text style={styles.decalText}>SYS.REC // AUD-NODE-V9</Text>
          <View style={styles.decalLine} />
          <View style={[styles.decalDot, recorderState.isRecording && !recorderState.isPaused && styles.decalDotActive]} />
        </View>

        {/* Display Panel */}
        <View style={[
          styles.displayPanel, 
          recorderState.isRecording && !recorderState.isPaused && styles.displayPanelActive,
          recorderState.isPaused && styles.displayPanelPaused
        ]}>
          {/* Neon Grid background effect using styling */}
          <View style={styles.gridOverlay} />
          
          <View style={styles.panelHeader}>
            <View style={styles.statusBadge}>
              {recorderState.isRecording && (
                <Animated.View style={[
                  styles.recIndicator,
                  { 
                    backgroundColor: recorderState.isPaused ? '#ffae00' : '#ff007f',
                    transform: [{ scale: pulseAnim }]
                  }
                ]} />
              )}
              <Text style={[
                styles.statusText,
                recorderState.isRecording && styles.statusTextActive,
                recorderState.isPaused && styles.statusTextPaused
              ]}>
                {!recorderState.isRecording ? 'STANDBY' : recorderState.isPaused ? 'REC_HOLD' : 'UPLINK_LIVE'}
              </Text>
            </View>
            <Text style={styles.samplerateText}>48.0 KHZ // 24-BIT</Text>
          </View>

          {/* Core Numerical Digital Clock */}
          <View style={styles.clockContainer}>
            <Text style={[
              styles.digitalClock,
              recorderState.isRecording && styles.digitalClockActive,
              recorderState.isPaused && styles.digitalClockPaused
            ]}>
              {formatTime(recorderState.duration)}
            </Text>
          </View>

          {/* Waveform Component */}
          {renderWaveform()}

          {/* Bottom telemetry detail */}
          <View style={styles.telemetryFooter}>
            <Text style={styles.telemetryText}>
              AMP_GAIN: {(recorderState.currentAmplitude * 100).toFixed(0)}%
            </Text>
            <Text style={styles.telemetryText}>
              BUFFER: {Math.min(100, Math.round(recorderState.duration * 1.6))}%
            </Text>
          </View>
        </View>

        {/* Custom Title Input - Cyberpunk styled */}
        {recorderState.isRecording && (
          <View style={styles.inputWrapper}>
            <View style={styles.inputCornerDecalTopLeft} />
            <View style={styles.inputCornerDecalBottomRight} />
            <TextInput
              style={styles.titleInput}
              placeholder="ENTER AUDIO LOG CODENAME..."
              placeholderTextColor="rgba(0, 240, 255, 0.3)"
              value={customTitle}
              onChangeText={setCustomTitle}
              autoCapitalize="characters"
              maxLength={26}
              underlineColorAndroid="transparent"
            />
          </View>
        )}

        {/* Primary Controls */}
        <View style={styles.controlsRow}>
          {!recorderState.isRecording ? (
            /* START RECORDING TRIGGER */
            <TouchableOpacity 
              onPress={handleStart}
              activeOpacity={0.8}
              style={styles.startOuterRing}
            >
              <View style={styles.startMiddleRing}>
                <View style={styles.startButton}>
                  <View style={styles.startButtonInner} />
                </View>
              </View>
              <Text style={styles.controlLabel}>INITIATE UPLINK</Text>
            </TouchableOpacity>
          ) : (
            /* ACTIVE RECORDING STATE TRIGGERS */
            <View style={styles.activeControlsContainer}>
              {/* DISCARD / CANCEL TRIGGER */}
              <TouchableOpacity 
                style={[styles.actionBtn, styles.discardBtn]} 
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnIconText, { color: '#ff3131' }]}>✕</Text>
                <Text style={[styles.btnLabel, { color: '#ff3131' }]}>ABORT</Text>
              </TouchableOpacity>

              {/* PAUSE / RESUME TRIGGER */}
              {recorderState.isPaused ? (
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.resumeBtn]} 
                  onPress={handleResume}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.btnIconText, { color: '#ffae00' }]}>▶</Text>
                  <Text style={[styles.btnLabel, { color: '#ffae00' }]}>RESUME</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.pauseBtn]} 
                  onPress={handlePause}
                  activeOpacity={0.7}
                >
                  <View style={styles.pauseIconContainer}>
                    <View style={styles.pauseBar} />
                    <View style={styles.pauseBar} />
                  </View>
                  <Text style={[styles.btnLabel, { color: '#00f0ff' }]}>PAUSE</Text>
                </TouchableOpacity>
              )}

              {/* STOP / SAVE TRIGGER */}
              <TouchableOpacity 
                style={[styles.actionBtn, styles.saveBtn]} 
                onPress={handleStop}
                disabled={recorderState.duration < 1}
                activeOpacity={0.7}
              >
                <View style={styles.saveIconBox} />
                <Text style={[styles.btnLabel, { color: '#39ff14' }]}>ARCHIVE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    backgroundColor: '#07080e',
    borderColor: '#1f2438',
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  // Toast Alert Notification (Cyberpunk Styled)
  savedAlert: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(7, 8, 14, 0.95)',
    borderColor: '#39ff14',
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    zIndex: 999,
    shadowColor: '#39ff14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertHeaderDot: {
    width: 6,
    height: 6,
    backgroundColor: '#39ff14',
    marginRight: 6,
    borderRadius: 3,
  },
  alertHeaderText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: 'bold',
    fontSize: 10,
    color: '#39ff14',
    letterSpacing: 2,
  },
  alertBodyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  alertNoteName: {
    fontSize: 12,
    color: '#8f9bbc',
    marginTop: 2,
    fontStyle: 'italic',
  },
  // Top Decals
  topDecalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  decalText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    color: '#8f9bbc',
    letterSpacing: 1,
  },
  decalLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1f2438',
    marginHorizontal: 10,
  },
  decalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1f2438',
  },
  decalDotActive: {
    backgroundColor: '#ff007f',
  },
  // Display Monitor Panel
  displayPanel: {
    width: '100%',
    height: 200,
    backgroundColor: '#0a0d16',
    borderWidth: 1.5,
    borderColor: '#16233b',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  displayPanelActive: {
    borderColor: '#00f0ff',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 3,
  },
  displayPanelPaused: {
    borderColor: '#ffae00',
    shadowColor: '#ffae00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 3,
  },
  gridOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.05,
    borderWidth: 0.5,
    borderColor: '#ffffff',
    // Mock grid using standard stylesheet borders
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 33, 56, 0.4)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderColor: '#1f2b48',
    borderWidth: 1,
  },
  recIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: 'bold',
    fontSize: 10,
    color: '#8f9bbc',
    letterSpacing: 1.5,
  },
  statusTextActive: {
    color: '#ff007f',
  },
  statusTextPaused: {
    color: '#ffae00',
  },
  samplerateText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    color: '#5c698a',
    letterSpacing: 1,
  },
  clockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    zIndex: 2,
  },
  digitalClock: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 42,
    fontWeight: '800',
    color: '#5c698a',
    letterSpacing: 2,
    textShadowColor: 'rgba(92, 105, 138, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  digitalClockActive: {
    color: '#00f0ff',
    textShadowColor: 'rgba(0, 240, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  digitalClockPaused: {
    color: '#ffae00',
    textShadowColor: 'rgba(255, 174, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  // Waveform render
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 80,
    width: '100%',
    zIndex: 1,
  },
  waveBar: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  // Telemetry Footer
  telemetryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  telemetryText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    color: '#4e5a78',
    letterSpacing: 1,
  },
  // Title Input
  inputWrapper: {
    width: '100%',
    marginTop: 16,
    backgroundColor: '#0a0d16',
    borderWidth: 1,
    borderColor: '#16233b',
    borderRadius: 8,
    position: 'relative',
    height: 44,
    justifyContent: 'center',
  },
  inputCornerDecalTopLeft: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: 6,
    height: 6,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#00f0ff',
  },
  inputCornerDecalBottomRight: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 6,
    height: 6,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#ff007f',
  },
  titleInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: '#00f0ff',
    paddingHorizontal: 12,
    fontSize: 12,
    letterSpacing: 1.5,
    height: '100%',
  },
  // Controls Layout
  controlsRow: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  startOuterRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  startMiddleRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  startButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#ff007f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff007f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  startButtonInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    opacity: 0.9,
  },
  controlLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ff007f',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 0, 127, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  // Active Controls (Record state controls)
  activeControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  actionBtn: {
    height: 60,
    width: 76,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#0a0d16',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  discardBtn: {
    borderColor: '#ff3131',
    shadowColor: '#ff3131',
  },
  pauseBtn: {
    borderColor: '#00f0ff',
    shadowColor: '#00f0ff',
  },
  resumeBtn: {
    borderColor: '#ffae00',
    shadowColor: '#ffae00',
  },
  saveBtn: {
    borderColor: '#39ff14',
    shadowColor: '#39ff14',
  },
  btnIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  btnLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  pauseIconContainer: {
    flexDirection: 'row',
    width: 14,
    height: 14,
    justifyContent: 'space-between',
    marginBottom: 6,
    marginTop: 2,
  },
  pauseBar: {
    width: 4,
    height: '100%',
    backgroundColor: '#00f0ff',
    borderRadius: 1,
  },
  saveIconBox: {
    width: 14,
    height: 14,
    backgroundColor: '#39ff14',
    borderRadius: 2,
    marginBottom: 6,
    marginTop: 2,
  },
});
