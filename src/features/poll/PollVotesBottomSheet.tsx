import React, {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  PanResponder,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { Poll, PollOption, PollVoter } from './types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.78;
const CLOSE_THRESHOLD = 100;
const HITSLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// ── Avatar ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30',
  '#5856D6', '#FF2D55', '#AF52DE', '#00C7BE',
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const Avatar: React.FC<{ voter: PollVoter; size: number }> = ({ voter, size }) => {
  const initials = voter.displayName
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');

  if (voter.avatarUri) {
    return (
      <Image
        source={{ uri: voter.avatarUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: avatarColor(voter.displayName),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.38, color: '#FFFFFF', fontWeight: '600' }}>
        {initials}
      </Text>
    </View>
  );
};

// ── Option section ────────────────────────────────────────────────────────────

interface OptionSectionProps {
  option: PollOption;
  index: number;
  percentage: number;
}

const OptionSection: React.FC<OptionSectionProps> = ({ option, index, percentage }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={sectionStyles.container}>
      {/* Header row */}
      <TouchableOpacity
        style={sectionStyles.header}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={sectionStyles.badge}>
          <Text style={sectionStyles.badgeText}>{index + 1}</Text>
        </View>

        <View style={sectionStyles.headerBody}>
          <Text style={sectionStyles.optionText} numberOfLines={expanded ? undefined : 2}>
            {option.text}
          </Text>
          {/* Result bar */}
          <View style={sectionStyles.barRow}>
            <View style={sectionStyles.barBg}>
              <View style={[sectionStyles.barFill, { width: `${percentage}%` }]} />
            </View>
            <Text style={sectionStyles.pctText}>{percentage}%</Text>
          </View>
        </View>

        <View style={sectionStyles.headerRight}>
          <Text style={sectionStyles.voterCount}>{option.voters.length}</Text>
          <Text style={sectionStyles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Collapsed: avatar strip */}
      {!expanded && option.voters.length > 0 && (
        <View style={sectionStyles.avatarStrip}>
          {option.voters.slice(0, 6).map((voter, i) => (
            <View
              key={voter.userId}
              style={[sectionStyles.avatarItem, i > 0 && { marginLeft: -9 }]}
            >
              <Avatar voter={voter} size={30} />
            </View>
          ))}
          {option.voters.length > 6 && (
            <View style={[sectionStyles.avatarMore, { marginLeft: -9 }]}>
              <Text style={sectionStyles.avatarMoreText}>+{option.voters.length - 6}</Text>
            </View>
          )}
        </View>
      )}

      {/* Expanded: full voter list */}
      {expanded && (
        <View style={sectionStyles.voterList}>
          {option.voters.length === 0 ? (
            <Text style={sectionStyles.emptyText}>No votes yet</Text>
          ) : (
            option.voters.map((voter) => (
              <View key={voter.userId} style={sectionStyles.voterRow}>
                <Avatar voter={voter} size={40} />
                <Text style={sectionStyles.voterName}>{voter.displayName}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};

const sectionStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#F9F9FB',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerBody: {
    flex: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    lineHeight: 18,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  pctText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
    minWidth: 34,
    textAlign: 'right',
  },
  headerRight: {
    alignItems: 'center',
    marginLeft: 8,
    minWidth: 32,
  },
  voterCount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  chevron: {
    fontSize: 9,
    color: '#C7C7CC',
    marginTop: 3,
  },
  avatarStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  avatarItem: {
    borderWidth: 2,
    borderColor: '#F9F9FB',
    borderRadius: 17,
  },
  avatarMore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F9F9FB',
  },
  avatarMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6C6C70',
  },
  voterList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    paddingTop: 8,
  },
  voterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  voterName: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#AEAEB2',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
});

// ── Bottom Sheet ──────────────────────────────────────────────────────────────

export interface PollVotesBottomSheetProps {
  poll: Poll | null;
  visible: boolean;
  onClose: () => void;
}

export const PollVotesBottomSheet: React.FC<PollVotesBottomSheetProps> = ({
  poll,
  visible,
  onClose,
}) => {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        damping: 22,
        stiffness: 180,
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(SHEET_HEIGHT);
    }
  }, [visible, translateY]);

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(onClose);
  }, [translateY, onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 6,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > CLOSE_THRESHOLD || gs.vy > 1.5) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 22,
            stiffness: 180,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const totalVotes = useMemo(
    () => (poll ? poll.options.reduce((s, o) => s + o.voters.length, 0) : 0),
    [poll]
  );

  const getPercentage = useCallback(
    (count: number) => (totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100)),
    [totalVotes]
  );

  if (!poll) return null;

  const participation =
    poll.totalGroupMembers > 0
      ? Math.round((totalVotes / poll.totalGroupMembers) * 100)
      : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      {/* Backdrop */}
      <TouchableOpacity style={sheetStyles.backdrop} activeOpacity={1} onPress={dismiss} />

      {/* Sheet */}
      <Animated.View style={[sheetStyles.sheet, { transform: [{ translateY }] }]}>
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={sheetStyles.handleZone}>
          <View style={sheetStyles.handle} />
        </View>

        {/* Header */}
        <View style={sheetStyles.header}>
          <View style={sheetStyles.headerLeft}>
            <Text style={sheetStyles.title}>Poll Results</Text>
            <Text style={sheetStyles.subtitle} numberOfLines={2}>
              {poll.question}
            </Text>
          </View>
          <TouchableOpacity onPress={dismiss} style={sheetStyles.closeBtn} hitSlop={HITSLOP}>
            <View style={sheetStyles.closeBtnInner}>
              <Text style={sheetStyles.closeBtnText}>✕</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Summary bar */}
        <View style={sheetStyles.summaryBar}>
          <Text style={sheetStyles.summaryText}>
            <Text style={sheetStyles.summaryBold}>{totalVotes}</Text>
            {' vote'}{totalVotes !== 1 ? 's' : ''} · {poll.totalGroupMembers} members
          </Text>
          <Text style={sheetStyles.participationText}>
            {participation}% participation
          </Text>
        </View>

        {/* Options */}
        <ScrollView
          style={sheetStyles.scroll}
          contentContainerStyle={sheetStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={Platform.OS === 'ios'}
        >
          {poll.options.map((opt, idx) => (
            <OptionSection
              key={opt.id}
              option={opt}
              index={idx}
              percentage={getPercentage(opt.voters.length)}
            />
          ))}
          <View style={sheetStyles.safeBottom} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const sheetStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 24,
  },
  handleZone: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D1D6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 3,
    lineHeight: 17,
  },
  closeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  closeBtnInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9F9FB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  summaryText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  summaryBold: {
    fontWeight: '700',
    color: '#1C1C1E',
  },
  participationText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
  },
  safeBottom: {
    height: Platform.OS === 'ios' ? 34 : 16,
  },
});
