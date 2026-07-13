import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SecureNote } from '../types';

interface LockedNoteCardProps {
  note: SecureNote;
  onPress: () => void;
  style?: ViewStyle;
}

export const LockedNoteCard: React.FC<LockedNoteCardProps> = ({
  note,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, style]}
      activeOpacity={0.8}
      accessibilityLabel={`Note "${note.title}" is locked. Tap to unlock.`}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={16} color="#e74c3c" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {note.title}
          </Text>
          <Text style={styles.lockedLabel}>Locked</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#ccc" />
      </View>

      <View style={styles.blurredContent}>
        <View style={styles.blurLine} />
        <View style={styles.blurLine} />
        <View style={styles.blurLineShort} />
      </View>

      <View style={styles.footer}>
        <Ionicons name="lock-closed-outline" size={13} color="#e74c3c" />
        <Text style={styles.footerText}>
          {note.lockMethod === 'biometric'
            ? 'Locked with biometrics'
            : note.lockMethod === 'pin'
              ? 'Locked with PIN'
              : 'Tap to unlock with Face ID / PIN'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#e74c3c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fde8e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  lockedLabel: {
    fontSize: 11,
    color: '#e74c3c',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  blurredContent: {
    gap: 6,
    marginBottom: 12,
    paddingLeft: 2,
  },
  blurLine: {
    height: 10,
    backgroundColor: '#e8e8e8',
    borderRadius: 5,
    width: '100%',
  },
  blurLineShort: {
    height: 10,
    backgroundColor: '#e8e8e8',
    borderRadius: 5,
    width: '65%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
});
