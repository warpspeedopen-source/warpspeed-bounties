import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { InlinePoll } from '../InlinePoll';

const mockPoll = {
  id: 'poll-1',
  question: 'Tabs or Spaces?',
  options: [
    { id: 'opt-1', text: 'Tabs', voterIds: ['user-1'] },
    { id: 'opt-2', text: 'Spaces', voterIds: ['user-2', 'user-3'] }
  ],
  allowMultipleChoices: false,
  creatorId: 'user-1',
  totalGroupParticipants: 4,
  createdAt: '2023-01-01T00:00:00Z'
};

describe('InlinePoll', () => {
  it('renders poll question and options', () => {
    const { getByText } = render(
      <InlinePoll poll={mockPoll} currentUserId="user-4" onVote={() => {}} onViewVotes={() => {}} />
    );
    
    expect(getByText('Tabs or Spaces?')).toBeTruthy();
    expect(getByText('Tabs')).toBeTruthy();
    expect(getByText('Spaces')).toBeTruthy();
    expect(getByText('3 votes')).toBeTruthy();
  });

  it('triggers onVote when an option is pressed', () => {
    const mockVote = jest.fn();
    const { getByTestId } = render(
      <InlinePoll poll={mockPoll} currentUserId="user-4" onVote={mockVote} onViewVotes={() => {}} />
    );
    
    fireEvent.press(getByTestId('vote-option-opt-1'));
    expect(mockVote).toHaveBeenCalledWith('poll-1', 'opt-1');
  });

  it('triggers onViewVotes when view votes is pressed', () => {
    const mockViewVotes = jest.fn();
    const { getByTestId } = render(
      <InlinePoll poll={mockPoll} currentUserId="user-4" onVote={() => {}} onViewVotes={mockViewVotes} />
    );
    
    fireEvent.press(getByTestId('view-votes-button'));
    expect(mockViewVotes).toHaveBeenCalledWith('poll-1');
  });
});
