import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Poll } from './types';
import { PollResultBar } from './PollResultBar';

interface PollMessageProps {
  poll: Poll;
  currentUserId: string;
  onVote: (pollId: string, optionId: string) => void;
  onViewVotes: (poll: Poll) => void;
  isOutgoing?: boolean;
}

export const PollMessage: React.FC<PollMessageProps> = ({
  poll,
  currentUserId,
  onVote,
  onViewVotes,
  isOutgoing = false,
}) => {
  const totalVotes = useMemo(
    () => poll.options.reduce((sum, opt) => sum + opt.voters.length, 0),
    [poll.options]
  );

  const userVotedIds = useMemo(
    () =>
      new Set(
        poll.options
          .filter((opt) => opt.voters.some((v) => v.userId === currentUserId))
          .map((opt) => opt.id)
      ),
    [poll.options, currentUserId]
  );

  const hasVoted = userVotedIds.size > 0;

  const uniqueVoterCount = useMemo(() => {
    const ids = new Set<string>();
    poll.options.forEach((opt) => opt.voters.forEach((v) => ids.add(v.userId)));
    return ids.size;
  }, [poll.options]);

  const getPercentage = useCallback(
    (count: number) => (totalVotes === 0 ? 0 : (count / totalVotes) * 100),
    [totalVotes]
  );

  return (
    <View
      style={[
        styles.bubble,
        isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
      ]}
    >
      {/* Poll label row */}
      <View style={styles.pollLabelRow}>
        <Text style={styles.pollIcon}>📊</Text>
        <Text style={styles.pollLabel}>POLL</Text>
        {poll.isClosed && <Text style={styles.closedTag}>Closed</Text>}
      </View>

      {/* Question */}
      <Text style={styles.question}>{poll.question}</Text>

      {poll.allowMultipleChoice && (
        <Text style={styles.multiHint}>Select multiple options</Text>
      )}

      {/* Options */}
      <View style={styles.options}>
        {poll.options.map((option) => {
          const selected = userVotedIds.has(option.id);
          const pct = getPercentage(option.voters.length);

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                selected && styles.optionButtonSelected,
                poll.isClosed && styles.optionButtonClosed,
              ]}
              onPress={() => !poll.isClosed && onVote(poll.id, option.id)}
              activeOpacity={poll.isClosed ? 1 : 0.65}
            >
              {/* Check circle */}
              <View style={[styles.check, selected && styles.checkSelected]}>
                {selected && <Text style={styles.checkMark}>✓</Text>}
              </View>

              <View style={styles.optionBody}>
                <View style={styles.optionTopRow}>
                  <Text
                    style={[styles.optionText, selected && styles.optionTextSelected]}
                    numberOfLines={3}
                  >
                    {option.text}
                  </Text>
                  <Text style={styles.voteCount}>{option.voters.length}</Text>
                </View>

                {(hasVoted || poll.isClosed) && (
                  <PollResultBar
                    percentage={pct}
                    isSelected={selected}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerMeta}>
          {uniqueVoterCount} of {poll.totalGroupMembers} voted
        </Text>
        <TouchableOpacity
          onPress={() => onViewVotes(poll)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.viewVotesLink}>View Votes →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    borderRadius: 16,
    padding: 14,
    maxWidth: '88%',
    marginVertical: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleIncoming: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    marginLeft: 8,
    borderBottomLeftRadius: 4,
  },
  bubbleOutgoing: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    marginRight: 8,
    borderBottomRightRadius: 4,
  },
  pollLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  pollIcon: {
    fontSize: 15,
  },
  pollLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 0.8,
  },
  closedTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF3B30',
    backgroundColor: '#FFF2F2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  question: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 20,
    marginBottom: 4,
  },
  multiHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  options: {
    marginTop: 6,
    gap: 6,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    backgroundColor: '#F9F9FB',
  },
  optionButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#EAF2FF',
  },
  optionButtonClosed: {
    opacity: 0.85,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
    flexShrink: 0,
  },
  checkSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  checkMark: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  optionBody: {
    flex: 1,
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
    marginRight: 8,
    lineHeight: 18,
  },
  optionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  voteCount: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  footerMeta: {
    fontSize: 12,
    color: '#8E8E93',
  },
  viewVotesLink: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
});
