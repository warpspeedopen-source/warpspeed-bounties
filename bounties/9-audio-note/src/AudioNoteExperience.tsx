import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { AudioNoteRecorder } from './components/AudioNoteRecorder';
import { AudioNotePlayer } from './components/AudioNotePlayer';

const { width } = Dimensions.get('window');

export const AudioNoteExperience: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#05060a" />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Core Container Frame */}
        <View style={styles.experienceWrapper}>
          {/* Cyberpunk Outer Frame Corner Accents */}
          <View style={[styles.cornerDecal, styles.topLeftCorner]} />
          <View style={[styles.cornerDecal, styles.topRightCorner]} />
          <View style={[styles.cornerDecal, styles.bottomLeftCorner]} />
          <View style={[styles.cornerDecal, styles.bottomRightCorner]} />

          {/* High-Tech Main Header */}
          <View style={styles.brandingHeader}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>NEON_NODE_V9</Text>
            </View>
            
            <View style={styles.titleGroup}>
              <Text style={styles.coreTitle}>TRANSSIGNAL DECK</Text>
              <Text style={styles.subTitle}>COGNITIVE AUDIO ARCHIVER & PLAYER</Text>
            </View>
            
            <View style={styles.statusTelemetryRow}>
              <View style={styles.statusPill}>
                <View style={styles.statusPillGreenDot} />
                <Text style={styles.statusPillText}>GRID_LINKED</Text>
              </View>
              <Text style={styles.telemetryVersion}>REV_4.9.2</Text>
            </View>
          </View>

          {/* Grid Background accent bars */}
          <View style={styles.headerSeparator}>
            <View style={styles.sepSegmentCyan} />
            <View style={styles.sepSegmentDark} />
            <View style={styles.sepSegmentMagenta} />
          </View>

          {/* Audio Note Recorder Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>[01]</Text>
              <Text style={styles.sectionTitle}>UPLINK SIGNAL TRANSCEIVER</Text>
            </View>
            <AudioNoteRecorder />
          </View>

          {/* Section Divider */}
          <View style={styles.sectionDivider}>
            <View style={styles.dividerDot} />
            <View style={styles.dividerLine} />
            <View style={styles.dividerDot} />
          </View>

          {/* Audio Note Player & Archive Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>[02]</Text>
              <Text style={styles.sectionTitle}>COGNITIVE CORE DATABASE</Text>
            </View>
            <AudioNotePlayer />
          </View>

          {/* Tech Footer details */}
          <View style={styles.footerBranding}>
            <Text style={styles.footerText}>
              WARPSPEED INDUSTRIES // SYSTEM TERMINAL 98-F
            </Text>
            <Text style={styles.footerSubText}>
              SECURE LOGGING ENCRYPTED // END-TO-END QUANTUM KEY
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Default export for easy drag-and-drop usage
export default AudioNoteExperience;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#05060a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  experienceWrapper: {
    width: '100%',
    maxWidth: 480, // constraints layout width beautifully on tablets/wider devices
    backgroundColor: '#08090f',
    borderColor: '#181b28',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  // Frame Accent Decals
  cornerDecal: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: '#3a4468',
  },
  topLeftCorner: {
    top: 10,
    left: 10,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRightCorner: {
    top: 10,
    right: 10,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeftCorner: {
    bottom: 10,
    left: 10,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRightCorner: {
    bottom: 10,
    right: 10,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  // Branding Header
  brandingHeader: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  logoBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderColor: '#00f0ff',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  logoBadgeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: 'bold',
    fontSize: 9,
    color: '#00f0ff',
    letterSpacing: 2,
  },
  titleGroup: {
    alignItems: 'center',
    marginBottom: 10,
  },
  coreTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ff007f',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 4,
  },
  statusTelemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0d16',
    borderWidth: 1,
    borderColor: '#19283c',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  statusPillGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#39ff14',
    marginRight: 6,
    shadowColor: '#39ff14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusPillText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#8f9bbc',
    letterSpacing: 1,
  },
  telemetryVersion: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 8,
    color: '#4e5a78',
    letterSpacing: 1,
  },
  headerSeparator: {
    flexDirection: 'row',
    height: 3,
    width: '100%',
    marginBottom: 20,
  },
  sepSegmentCyan: {
    flex: 2,
    backgroundColor: '#00f0ff',
  },
  sepSegmentDark: {
    flex: 5,
    backgroundColor: '#1f2438',
  },
  sepSegmentMagenta: {
    flex: 1,
    backgroundColor: '#ff007f',
  },
  // Sections
  sectionContainer: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: 'bold',
    fontSize: 11,
    color: '#ff007f',
    marginRight: 6,
  },
  sectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: 'bold',
    fontSize: 10,
    color: '#ffffff',
    letterSpacing: 2,
  },
  // Section Dividers
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 24,
  },
  dividerDot: {
    width: 4,
    height: 4,
    backgroundColor: '#1f2438',
    borderRadius: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#111422',
    marginHorizontal: 12,
  },
  // Footer
  footerBranding: {
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  footerText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#3c4761',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  footerSubText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 7,
    color: '#2a3144',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 2,
  },
});
