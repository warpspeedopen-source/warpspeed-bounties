import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Poll } from '../../types/poll';

interface PollMessageProps {
  poll: Poll;
  currentUserId: string;
  onVote: (optionId: string) => void;
  onViewVotes: () => void;
}

export const PollMessage: React.FC<PollMessageProps> = ({
  poll,
  currentUserId,
  onVote,
  onViewVotes,
}) => {
  const totalVotes = useMemo(() => {
    return poll.options.reduce((sum, option) => sum + option.voterIds.length, 0);
  }, [poll]);

  // Handle unique users if multiple choices allowed?
  // We'll calculate percentage based on total votes for this basic display,
  // or based on participants if totalGroupParticipants is used.
  const calculatePercentage = (votes: number) => {
    if (poll.totalGroupParticipants > 0) {
      return Math.round((votes / poll.totalGroupParticipants) * 100);
    }
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{poll.question}</Text>
      <Text style={styles.subtitle}>
        {poll.allowMultipleChoices ? 'Select one or more' : 'Select one'}
      </Text>

      <View style={styles.optionsList}>
        {poll.options.map((option) => {
          const hasVoted = option.voterIds.includes(currentUserId);
          const percentage = calculatePercentage(option.voterIds.length);
          const voteCount = option.voterIds.length;

          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionContainer, hasVoted && styles.optionVoted]}
              onPress={() => onVote(option.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.progressBar,
                  { width: `${percentage}%` },
                  hasVoted && styles.progressBarVoted,
                ]}
              />
              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  {hasVoted && <View style={styles.checkCircle} />}
                  {!hasVoted && <View style={styles.uncheckCircle} />}
                  <Text style={styles.optionText} numberOfLines={2}>
                    {option.text}
                  </Text>
                </View>
                <View style={styles.optionRight}>
                  {voteCount > 0 && (
                    <View style={styles.voteAvatarsContainer}>
                      <Text style={styles.voteCountText}>{voteCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.viewVotesButton} onPress={onViewVotes}>
          <Text style={styles.viewVotesText}>View votes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginVertical: 8,
  },
  question: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  optionsList: {
    gap: 8,
  },
  optionContainer: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 44,
  },
  optionVoted: {
    borderColor: '#007AFF',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#f0f0f0',
  },
  progressBarVoted: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  uncheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#ccc',
    marginRight: 10,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#007AFF',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    marginRight: 10,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    flexShrink: 1,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  voteAvatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteCountText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    alignItems: 'center',
  },
  viewVotesButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  viewVotesText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
