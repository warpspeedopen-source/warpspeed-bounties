import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Email } from '../types';

interface EmailListItemProps {
  email: Email;
  onPress: (email: Email) => void;
}

/**
 * A single email row in the inbox list.
 * Shows clear visual difference between opened and unopened emails.
 */
export const EmailListItem: React.FC<EmailListItemProps> = ({ email, onPress }) => {
  const timeString = formatTimestamp(email.timestamp);

  return (
    <TouchableOpacity
      style={[styles.container, !email.isOpened && styles.unreadContainer]}
      onPress={() => onPress(email)}
      activeOpacity={0.7}
    >
      {/* Sender Avatar */}
      <View style={[styles.avatar, !email.isOpened && styles.unreadAvatar]}>
        <Text style={styles.avatarText}>
          {email.from.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Email Content */}
      <View style={styles.content}>
        {/* Header Row: Sender + Time */}
        <View style={styles.headerRow}>
          <Text
            style={[styles.senderName, !email.isOpened && styles.unreadText]}
            numberOfLines={1}
          >
            {email.from.name}
          </Text>
          <Text style={[styles.time, !email.isOpened && styles.unreadTime]}>
            {timeString}
          </Text>
        </View>

        {/* Subject */}
        <Text
          style={[styles.subject, !email.isOpened && styles.unreadText]}
          numberOfLines={1}
        >
          {email.subject}
        </Text>

        {/* Preview */}
        <Text style={styles.preview} numberOfLines={1}>
          {email.preview}
        </Text>
      </View>

      {/* Star */}
      {email.isStarred && <Text style={styles.star}>★</Text>}

      {/* Unread indicator */}
      {!email.isOpened && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    // Today: show time
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  unreadContainer: {
    backgroundColor: '#F8F9FF',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  unreadAvatar: {
    backgroundColor: '#007AFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    color: '#8E8E93',
  },
  unreadTime: {
    fontWeight: '600',
    color: '#007AFF',
  },
  subject: {
    fontSize: 15,
    color: '#1C1C1E',
    marginBottom: 2,
  },
  preview: {
    fontSize: 13,
    color: '#8E8E93',
  },
  star: {
    fontSize: 16,
    color: '#FFC107',
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
});

export default EmailListItem;
