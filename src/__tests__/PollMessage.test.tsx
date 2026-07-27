import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PollMessage } from '../components/PollMessage';

const poll = {
  pollId: 'poll-1',
  question: 'Favorite fruit?',
  options: [
    { id: 1, text: 'Apple', votes: ['user1', 'user2'] },
    { id: 2, text: 'Banana', votes: ['user3'] },
  ],
  totalParticipants: 5,
  userVotes: ['1'],
  multipleChoice: false,
  onVote: jest.fn(),
};

describe('PollMessage', () => {
  it('renders poll question and options', () => {
    const { getByText } = render(<PollMessage {...poll} />);
    expect(getByText('Favorite fruit?')).toBeTruthy();
    expect(getByText('Apple')).toBeTruthy();
    expect(getByText('Banana')).toBeTruthy();
  });

  it('calls onVote when option pressed', () => {
    const { getByText } = render(<PollMessage {...poll} />);
    fireEvent.press(getByText('Apple'));
    expect(poll.onVote).toHaveBeenCalledWith(1);
  });

  it('shows vote counts and percentages', () => {
    const { getByText } = render(<PollMessage {...poll} />);
    expect(getByText('2 votes')).toBeTruthy();
    expect(getByText('1 vote')).toBeTruthy();
  });
});
