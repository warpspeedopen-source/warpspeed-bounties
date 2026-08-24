import React from 'react';
import { View } from 'react-native';
import { storiesOf } from '@storybook/react-native';
import { PollCreationSheet } from './PollCreationSheet';
import { PollMessage } from './PollMessage';
import { Poll } from '../../types/poll';

const mockPoll: Poll = {
  id: '1',
  question: 'Where should we go for the team offsite?',
  options: [
    { id: 'opt1', text: 'Mountains', votedUsers: ['user1', 'user2'] },
    { id: 'opt2', text: 'Beach', votedUsers: ['user3'] },
    { id: 'opt3', text: 'City', votedUsers: [] }
  ],
  allowMultiple: false,
  createdBy: 'user1',
  createdAt: Date.now()
};

storiesOf('Poll', module)
  .addDecorator(getStory => <View style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>{getStory()}</View>)
  .add('Poll Message', () => (
    <PollMessage 
      poll={mockPoll} 
      currentUserId='user1' 
      onVote={() => {}} 
      totalParticipants={10} 
    />
  ))
  .add('Poll Creation Sheet', () => (
    <PollCreationSheet 
      visible={true} 
      onClose={() => {}} 
      onCreatePoll={() => {}} 
    />
  ));
