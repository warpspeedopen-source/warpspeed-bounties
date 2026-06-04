import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Poll } from './types';

interface InlinePollProps {
  poll: Poll;
  currentUserId: string;
  onVote: (pollId: string, optionId: string) => void;
  onViewVotes: (pollId: string) => void;
}

export const InlinePoll: React.FC<InlinePollProps> = ({ poll, currentUserId, onVote, onViewVotes }) => {
  const totalVotes = poll.options.reduce((acc, opt) => acc + opt.voterIds.length, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{poll.question}</Text>
      <Text style={styles.subtitle}>
        {poll.allowMultipleChoices ? 'Select one or more' : 'Select one'}
      </Text>
      
      {poll.options.map((option) => {
        const optionVotes = option.voterIds.length;
        const percentage = poll.totalGroupParticipants > 0 
          ? (optionVotes / poll.totalGroupParticipants) * 100 
          : 0;
        const hasVoted = option.voterIds.includes(currentUserId);

        return (
          <TouchableOpacity 
            key={option.id} 
            style={styles.optionContainer} 
            onPress={() => onVote(poll.id, option.id)}
            testID={`vote-option-${option.id}`}
          >
            <View style={styles.optionRow}>
              <Text style={styles.optionText}>{option.text}</Text>
              <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${percentage}%`, backgroundColor: hasVoted ? '#007AFF' : '#ccc' }
                ]} 
              />
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={styles.footer}>
        <Text style={styles.totalVotes}>{totalVotes} votes</Text>
        <TouchableOpacity onPress={() => onViewVotes(poll.id)} testID="view-votes-button">
          <Text style={styles.viewVotesText}>View Votes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8, marginVertical: 8 },
  question: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 12 },
  optionContainer: { marginBottom: 12 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  optionText: { fontSize: 14, color: '#333' },
  percentageText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  progressBarBackground: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: '#ddd' },
  totalVotes: { fontSize: 12, color: '#666' },
  viewVotesText: { fontSize: 12, color: '#007AFF', fontWeight: 'bold' }
});
