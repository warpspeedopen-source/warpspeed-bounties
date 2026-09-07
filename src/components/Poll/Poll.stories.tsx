import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { PollMessage } from './PollMessage';
import { PollCreationSheet } from './PollCreationSheet';
import { ViewVotesSheet } from './ViewVotesSheet';
import { Poll, User } from '../../types/poll';

export default {
  title: 'components/Poll',
};

const mockUsers: Record<string, User> = {
  u1: { id: 'u1', name: 'Alice' },
  u2: { id: 'u2', name: 'Bob' },
  u3: { id: 'u3', name: 'Charlie' },
};

const initialPoll: Poll = {
  id: 'p1',
  question: 'What time should we meet?',
  options: [
    { id: 'o1', text: '10:00 AM', voterIds: ['u1', 'u2'] },
    { id: 'o2', text: '1:00 PM', voterIds: ['u3'] },
    { id: 'o3', text: '3:00 PM', voterIds: [] },
  ],
  allowMultipleChoices: false,
  totalGroupParticipants: 5,
  creatorId: 'u1',
  createdAt: new Date(),
};

export const PollMessageStory = () => {
  const [poll, setPoll] = useState(initialPoll);
  const currentUserId = 'u1';

  const handleVote = (optionId: string) => {
    setPoll((prev) => {
      const newOptions = prev.options.map((opt) => {
        const isSelected = opt.id === optionId;
        const voterIds = [...opt.voterIds];
        
        if (!prev.allowMultipleChoices) {
          // Remove user from all other options
          if (!isSelected) {
            return { ...opt, voterIds: voterIds.filter((id) => id !== currentUserId) };
          }
        }
        
        if (isSelected) {
          if (voterIds.includes(currentUserId)) {
            return { ...opt, voterIds: voterIds.filter((id) => id !== currentUserId) };
          } else {
            return { ...opt, voterIds: [...voterIds, currentUserId] };
          }
        }
        return opt;
      });
      return { ...prev, options: newOptions };
    });
  };

  return (
    <View style={styles.container}>
      <PollMessage
        poll={poll}
        currentUserId={currentUserId}
        onVote={handleVote}
        onViewVotes={() => console.log('View votes pressed')}
      />
    </View>
  );
};

export const PollCreationStory = () => {
  return (
    <View style={styles.containerModal}>
      <PollCreationSheet
        onClose={() => console.log('Close pressed')}
        onSubmit={(data) => console.log('Submit:', data)}
      />
    </View>
  );
};

export const ViewVotesStory = () => {
  return (
    <View style={styles.containerModal}>
      <ViewVotesSheet
        poll={initialPoll}
        users={mockUsers}
        onClose={() => console.log('Close pressed')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerModal: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 50,
  }
});
