/**
 * PollMessage Component
 * Renders an inline poll message inside the chat conversation
 * Bounty #3: Messenger Group Chat Poll Creation and Voting UI
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Poll, PollVoter, PollResults } from '../types';
import { PollResultBar } from './PollResultBar';
import { PollVotesBottomSheet } from './PollVotesBottomSheet';
import { usePoll } from '../hooks/usePoll';

interface PollMessageProps {
  poll: Poll;
  currentUserId: string;
  totalParticipants?: number;
  onVote?: (pollId: string, optionIds: string[]) => void;
}

export const PollMessage: React.FC<PollMessageProps> = ({
  poll: initialPoll,
  currentUserId,
  totalParticipants = 8,
  onVote,
}) => {
  const [showVotesSheet, setShowVotesSheet] = useState(false);

  const {
    poll,
    results,
    castVote,
    hasUserVoted,
    selectedOptionIds,
  } = usePoll({
    initialPoll,
    currentUserId,
    totalParticipants,
  });

  if (!poll || !results) return null;

  const isClosed = poll.status === 'closed';
  const canVote = !isClosed;
  const maxVotes = Math.max(...results.optionResults.map((r) => r.voteCount), 1);
  const totalUniqueVoters = useMemo(() => {
    const seen = new Set<string>();
    poll.options.forEach((opt) => {
      opt.voters.forEach((v) => seen.add(v.userId));
    });
    return seen.size;
  }, [poll]);

  const handleOptionPress = useCallback(
    (optionId: string) => {
      if (!canVote) return;

      let newSelectedIds: string[];

      if (poll.voteMode === 'single') {
        // Single choice: toggle the selected option
        if (selectedOptionIds.includes(optionId)) {
          newSelectedIds = []; // Deselect
        } else {
          newSelectedIds = [optionId];
        }
      } else {
        // Multiple choice: toggle the option in the selection
        if (selectedOptionIds.includes(optionId)) {
          newSelectedIds = selectedOptionIds.filter((id) => id !== optionId);
        } else {
          newSelectedIds = [...selectedOptionIds, optionId];
        }
      }

      const voter: PollVoter = {
        userId: currentUserId,
        displayName: 'You',
      };

      castVote(newSelectedIds, voter);
      onVote?.(poll.id, newSelectedIds);
    },
    [poll, canVote, selectedOptionIds, currentUserId, castVote, onVote]
  );

  return (
    <View style={styles.container}>
      {/* Poll header */}
      <View style={styles.pollHeader}>
        <View style={styles.iconCircle}>
          <Text style={styles.pollIcon}>📊</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.pollTypeLabel}>Poll</Text>
          {isClosed && (
            <View style={styles.closedBadge}>
              <Text style={styles.closedBadgeText}>Closed</Text>
            </View>
          )}
        </View>
      </View>

      {/* Question */}
      <Text style={styles.question}>{poll.question}</Text>

      {/* Vote mode indicator */}
      <Text style={styles.voteModeHint}>
        {poll.voteMode === 'single'
          ? 'Select one option'
          : 'Select one or more options'}
      </Text>

      {/* Options as result bars */}
      <View style={styles.optionsContainer}>
        {results.optionResults.map((result, index) => {
          const isLeading =
            result.voteCount === maxVotes && result.voteCount > 0;

          return (
            <PollResultBar
              key={result.option.id}
              result={result}
              index={index}
              maxVotes={maxVotes}
              isSelected={result.isSelected}
              isLeading={isLeading}
              onPress={canVote ? handleOptionPress : undefined}
              disabled={!canVote}
              showVoters={hasUserVoted || isClosed}
            />
          );
        })}
      </View>

      {/* Footer with vote count and view votes action */}
      <View style={styles.footer}>
        <Text style={styles.totalVotesText}>
          {totalUniqueVoters} of {poll.totalParticipants} voted
        </Text>
        <TouchableOpacity
          onPress={() => setShowVotesSheet(true)}
          style={styles.viewVotesButton}
        >
          <Text style={styles.viewVotesText}>View Votes</Text>
        </TouchableOpacity>
      </View>

      {/* Creator info */}
      <View style={styles.creatorRow}>
        {poll.createdBy.avatarUri ? (
          <Image
            source={{ uri: poll.createdBy.avatarUri }}
            style={styles.creatorAvatar}
          />
        ) : (
          <View style={styles.creatorAvatarFallback}>
            <Text style={styles.creatorInitial}>
              {poll.createdBy.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.creatorName}>
          Created by {poll.createdBy.displayName}
        </Text>
      </View>

      {/* Votes Bottom Sheet */}
      {showVotesSheet && (
        <PollVotesBottomSheet
          visible={showVotesSheet}
          results={results}
          onClose={() => setShowVotesSheet(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pollIcon: {
    fontSize: 18,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pollTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285F4',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closedBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
  },
  closedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF3B30',
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 24,
  },
  voteModeHint: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 14,
  },
  optionsContainer: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  totalVotesText: {
    fontSize: 13,
    color: '#888888',
  },
  viewVotesButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewVotesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285F4',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  creatorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  creatorAvatarFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  creatorInitial: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  creatorName: {
    fontSize: 12,
    color: '#AAAAAA',
  },
});
