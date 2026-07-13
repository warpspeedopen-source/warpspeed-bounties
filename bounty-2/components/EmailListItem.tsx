import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  StyleSheet,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { Email } from '../types';
import { inboxStore } from '../state/inboxStore';

interface Props {
  email: Email;
}

const SWIPE_THRESHOLD = 80;

const EmailListItem: React.FC<Props> = ({ email }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_, gs) => {
        translateX.setValue(Math.min(0, gs.dx));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const resetSwipe = useCallback(() => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
  }, [translateX]);

  const handlePress = useCallback(() => {
    if (email.isUnread) inboxStore.markRead(email.id);
  }, [email]);

  return (
    <View style={styles.wrapper}>
      {/* Revealed actions behind the row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionArchive}
          onPress={resetSwipe}
          accessibilityLabel="Archive"
        >
          <Text style={styles.actionText}>Archive</Text>
        </TouchableOpacity>
      </View>

      {/* Main row */}
      <Animated.View
        style={[styles.row, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePress}
          onLongPress={() => inboxStore.toggleStar(email.id)}
          accessibilityLabel={`${email.isUnread ? 'Unread' : 'Read'}: ${email.subject}`}
        >
          <View style={styles.inner}>
            {/* Left: avatar + unread dot */}
            <View style={styles.leftCol}>
              <View style={[styles.avatar, email.isUnread && styles.avatarUnread]}>
                <Text style={styles.avatarText}>
                  {email.from.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              {email.isUnread && <View style={styles.unreadDot} />}
            </View>

            {/* Center: content */}
            <View style={styles.content}>
              <View style={styles.topRow}>
                <Text
                  style={[styles.sender, email.isUnread && styles.senderUnread]}
                  numberOfLines={1}
                >
                  {email.from.name}
                </Text>
                <Text style={styles.time}>
                  {formatTime(email.timestamp)}
                </Text>
              </View>
              <Text
                style={[styles.subject, email.isUnread && styles.subjectUnread]}
                numberOfLines={1}
              >
                {email.subject}
              </Text>
              <Text style={styles.preview} numberOfLines={2}>
                {email.preview}
              </Text>
            </View>

            {/* Right: star + attachment */}
            <View style={styles.rightCol}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  inboxStore.toggleStar(email.id);
                }}
                accessibilityLabel={email.isStarred ? 'Unstar' : 'Star'}
              >
                <Text style={styles.star}>
                  {email.isStarred ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
              {email.hasAttachment && <Text style={styles.clip}>📎</Text>}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / 86_400_000,
  );
  if (diffDays === 0) {
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  actionsRow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionArchive: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  row: {
    backgroundColor: '#fff',
  },
  inner: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  leftCol: {
    alignItems: 'center',
    marginRight: 12,
    width: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUnread: {
    backgroundColor: '#1a73e8',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a73e8',
    marginTop: 4,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sender: {
    fontSize: 15,
    color: '#444',
    flex: 1,
    marginRight: 8,
  },
  senderUnread: {
    fontWeight: '700',
    color: '#111',
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
  subject: {
    fontSize: 14,
    color: '#222',
    marginTop: 2,
  },
  subjectUnread: {
    fontWeight: '700',
    color: '#000',
  },
  preview: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
    lineHeight: 18,
  },
  rightCol: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 28,
  },
  star: {
    fontSize: 18,
    color: '#f5a623',
    marginBottom: 4,
  },
  clip: {
    fontSize: 14,
  },
});

export default observer(EmailListItem);
