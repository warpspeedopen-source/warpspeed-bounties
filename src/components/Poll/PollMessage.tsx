import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Poll } from '../../types/poll';
import { ViewVotesSheet } from './ViewVotesSheet';

interface PollMessageProps {
  poll: Poll;
  currentUserId: string;
  onVote: (pollId: string, optionId: string) => void;
  totalParticipants: number;
}

export const PollMessage: React.FC<PollMessageProps> = ({ poll, currentUserId, onVote, totalParticipants }) => {
  const [showVotes, setShowVotes] = useState(false);

  const uniqueVoters = new Set(poll.options.flatMap(opt => opt.votedUsers)).size;
  const hasVoted = poll.options.some(opt => opt.votedUsers.includes(currentUserId));

  const handleVote = (optionId: string) => {
    if (!hasVoted || poll.allowMultiple) {
      onVote(poll.id, optionId);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{poll.question}</Text>
      
      {poll.options.map(option => {
        const percentage = totalParticipants > 0 ? Math.round((option.votedUsers.length / totalParticipants) * 100) : 0;
        const isSelected = option.votedUsers.includes(currentUserId);
        
        return (
          <TouchableOpacity
            key={option.id}
            style={[styles.option, isSelected && styles.selectedOption]}
            onPress={() => handleVote(option.id)}
            disabled={hasVoted && !poll.allowMultiple}
          >
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${percentage}%` }]} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>{option.text}</Text>
              <Text style={styles.percentage}>{percentage}%</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={styles.footer}>
        <Text style={styles.votesInfo}>{uniqueVoters} vote{uniqueVoters !== 1 ? 's' : ''}</Text>
        <TouchableOpacity onPress={() => setShowVotes(true)}>
          <Text style={styles.viewVotes}>View votes</Text>
        </TouchableOpacity>
      </View>

      <ViewVotesSheet
        visible={showVotes}
        onClose={() => setShowVotes(false)}
        poll={poll}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginVertical: 5, marginHorizontal: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  question: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  option: { marginBottom: 10, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e0e0e0' },
  selectedOption: { borderColor: '#25D366', borderWidth: 2 },
  progressContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f0f0f0' },
  progressBar: { height: '100%', backgroundColor: '#e8f5e9' },
  optionContent: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  optionText: { fontSize: 14, flex: 1 },
  percentage: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  votesInfo: { color: '#888', fontSize: 12 },
  viewVotes: { color: '#007AFF', fontSize: 12, fontWeight: 'bold' }
});
