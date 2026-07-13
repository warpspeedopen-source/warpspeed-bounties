import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Poll, PollResult, POLL_COLORS } from '../types';

interface PollResultsProps {
  poll: Poll;
  onViewVotes: (pollId: string) => void;
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

function getLeadingOptionIds(results: PollResult[]): string[] {
  const maxVotes = Math.max(...results.map((r) => r.voteCount));
  if (maxVotes === 0) return [];
  return results.filter((r) => r.voteCount === maxVotes).map((r) => r.optionId);
}

export const PollResults: React.FC<PollResultsProps> = ({ poll, onViewVotes }) => {
  const results = getResults(poll);
  const totalVotes = results.reduce((s, r) => s + r.voteCount, 0);
  const leadingIds = getLeadingOptionIds(results);

  return (
    <View style={styles.container}>
      {results.map((result) => {
        const isLeading = leadingIds.includes(result.optionId);
        const isUserVote = poll.userVote?.includes(result.optionId);

        return (
          <View key={result.optionId} style={styles.resultRow}>
            <View style={styles.labelRow}>
              <View style={styles.labelLeft}>
                {isLeading && totalVotes > 0 && (
                  <Text style={styles.crown}>👑</Text>
                )}
                <Text
                  style={[
                    styles.optionLabel,
                    isUserVote && styles.optionLabelVoted,
                  ]}
                  numberOfLines={1}
                >
                  {result.text}
                </Text>
              </View>
              <Text style={styles.statText}>
                {result.voteCount} vote{result.voteCount !== 1 ? 's' : ''} ({Math.round(result.percentage)}%)
              </Text>
            </View>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${Math.max(result.percentage, 1)}%`,
                    backgroundColor: result.color,
                  },
                ]}
              />
              {isUserVote && (
                <View style={styles.voteDot} />
              )}
            </View>
          </View>
        );
      })}

      <View style={styles.footer}>
        <Text style={styles.totalText}>{totalVotes} total vote{totalVotes !== 1 ? 's' : ''}</Text>
        <TouchableOpacity
          style={styles.viewVotesBtn}
          onPress={() => onViewVotes(poll.id)}
        >
          <Text style={styles.viewVotesText}>View Votes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  resultRow: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  crown: {
    fontSize: 12,
    marginRight: 4,
  },
  optionLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  optionLabelVoted: {
    fontWeight: '700',
    color: '#0A84FF',
  },
  statText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  barBg: {
    height: 28,
    backgroundColor: '#2C2C2E',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 6,
    opacity: 0.7,
  },
  voteDot: {
    position: 'absolute',
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0A84FF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  totalText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  viewVotesBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
  },
  viewVotesText: {
    fontSize: 13,
    color: '#0A84FF',
    fontWeight: '600',
  },
});
