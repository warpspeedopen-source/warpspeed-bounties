import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SectionList,
} from 'react-native';
import { Poll, PollResult, POLL_COLORS } from '../types';

interface ViewVotesSheetProps {
  visible: boolean;
  poll: Poll | null;
  onClose: () => void;
}

function getResults(poll: Poll): PollResult[] {
  const total = poll.options.reduce((sum, o) => sum + o.voters.length, 0);
  return poll.options.map((option, i) => ({
    optionId: option.id,
    text: option.text,
    voteCount: option.voters.length,
    percentage: total > 0 ? (option.voters.length / total) * 100 : 0,
    color: POLL_COLORS[i % POLL_COLORS.length],
    voters: [...option.voters],
  }));
}

export const ViewVotesSheet: React.FC<ViewVotesSheetProps> = ({
  visible,
  poll,
  onClose,
}) => {
  if (!visible || !poll) return null;

  const results = getResults(poll);
  const sections = results
    .filter((r) => r.voters.length > 0)
    .map((r) => ({
      title: `${r.text} (${r.voteCount})`,
      data: r.voters,
      color: r.color,
    }));

  const noVotes = sections.length === 0;

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.handleRow}>
          <View style={styles.handle} />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Votes</Text>
        <Text style={styles.questionText}>{poll.question}</Text>

        {noVotes ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No votes yet</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item, index) => `${item.userId}_${index}`}
            style={styles.list}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <View style={[styles.colorDot, { backgroundColor: section.color }]} />
                <Text style={styles.sectionTitle} numberOfLines={1}>
                  {section.title}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={styles.voterRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.voterInfo}>
                  <Text style={styles.voterName}>{item.username}</Text>
                  <Text style={styles.voterTime}>
                    {new Date(item.votedAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1001,
  },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  handleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A3C',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: 8,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#0A84FF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
  },
  questionText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  list: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  voterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: 18,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voterInfo: {
    flex: 1,
  },
  voterName: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  voterTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
