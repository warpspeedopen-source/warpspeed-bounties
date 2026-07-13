import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Poll } from '../types';
import { PollVoting } from './PollVoting';
import { PollResults } from './PollResults';

interface InlinePollProps {
  poll: Poll;
  currentUserId: string;
  currentUsername: string;
  onVote: (pollId: string, optionIds: string[]) => void;
  onViewVotes: (pollId: string) => void;
}

export const InlinePoll: React.FC<InlinePollProps> = ({
  poll,
  currentUserId,
  currentUsername,
  onVote,
  onViewVotes,
}) => {
  const hasVoted = poll.userVote !== undefined;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>📊 Poll</Text>
        </View>
        <Text style={styles.createdBy}>
          by {poll.createdBy}
        </Text>
      </View>

      <Text style={styles.question}>{poll.question}</Text>

      <Text style={styles.subtitle}>
        {poll.isMultiChoice ? 'Select all that apply' : 'Select one option'}
      </Text>

      {hasVoted ? (
        <PollResults poll={poll} onViewVotes={onViewVotes} />
      ) : (
        <PollVoting
          poll={poll}
          currentUserId={currentUserId}
          currentUsername={currentUsername}
          onVote={onVote}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: '#2C2C2E',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  createdBy: {
    fontSize: 12,
    color: '#8E8E93',
  },
  question: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 14,
  },
});
