import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';

// --- MOCK DATA & TYPES --- //
// In a real implementation, these would come from a central types directory

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollMessageProps {
  question: string;
  options: PollOption[];
  isMultiChoice?: boolean; // For future support
  onVote: (selectedOptionIds: string[]) => void;
  onViewVotes: () => void;
  // This would likely be derived from a global user state
  currentUserId: string;
  // In a real app, this would be a more complex object with user IDs
  voterMap: Record<string, string[]>; // { optionId: userId[] }
}

const PollMessage: React.FC<PollMessageProps> = ({
  question,
  options,
  isMultiChoice = false,
  onVote,
  onViewVotes,
  currentUserId,
  voterMap: initialVoterMap,
}) => {
  const [voterMap, setVoterMap] = useState(initialVoterMap);

  const currentUserVotes = useMemo(() => {
    const votes: string[] = [];
    for (const optionId in voterMap) {
      if (voterMap[optionId].includes(currentUserId)) {
        votes.push(optionId);
      }
    }
    return votes;
  }, [voterMap, currentUserId]);

  const hasVoted = currentUserVotes.length > 0;

  const totalVotes = useMemo(() => {
    // Use a Set to count unique voters across all options
    const uniqueVoters = new Set<string>();
    Object.values(voterMap).forEach(voters => {
      voters.forEach(voterId => uniqueVoters.add(voterId));
    });
    return uniqueVoters.size;
  }, [voterMap]);

  const handleVote = (optionId: string) => {
    if (hasVoted) return; // For single-choice, prevent re-voting for now

    // Simulate optimistic update
    const newVoterMap = { ...voterMap };
    newVoterMap[optionId] = [...(newVoterMap[optionId] || []), currentUserId];
    setVoterMap(newVoterMap);

    // Call the passed-in handler to persist the vote
    onVote([optionId]);
  };

  const renderOption = (option: PollOption, index: number) => {
    const isSelectedByCurrentUser = currentUserVotes.includes(option.id);
    const voteCount = voterMap[option.id]?.length || 0;
    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

    const progressBarStyle: StyleProp<ViewStyle> = {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: `${percentage}%`,
      backgroundColor: isSelectedByCurrentUser ? '#D6F5D6' : '#EAEAEA',
      borderRadius: 8,
    };

    return (
      <TouchableOpacity
        key={option.id}
        style={styles.optionContainer}
        onPress={() => handleVote(option.id)}
        disabled={hasVoted}
      >
        {hasVoted && <View style={progressBarStyle} />}
        <View style={styles.optionContent}>
          <Text style={styles.optionText}>{option.text}</Text>
          {hasVoted && (
            <View style={styles.voteInfo}>
              {isSelectedByCurrentUser && <Text style={styles.checkMark}>✓</Text>}
              <Text style={styles.percentageText}>{`${Math.round(percentage)}%`}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.optionsList}>
        {options.map(renderOption)}
      </View>
      <View style={styles.footer}>
        <Text style={styles.totalVotesText}>
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </Text>
        <TouchableOpacity onPress={onViewVotes}>
          <Text style={styles.viewVotesButton}>View Votes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  question: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111',
  },
  optionsList: {
    marginBottom: 12,
  },
  optionContainer: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    justifyContent: 'center',
    minHeight: 42,
    overflow: 'hidden', // to contain the progress bar
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent', // ensure content is above progress bar
  },
  optionText: {
    fontSize: 15,
    color: '#333',
  },
  voteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkMark: {
    color: 'green',
    fontWeight: 'bold',
    marginRight: 8,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  totalVotesText: {
    fontSize: 13,
    color: '#666',
  },
  viewVotesButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF', // A standard blue link color
  },
});

export default PollMessage;
