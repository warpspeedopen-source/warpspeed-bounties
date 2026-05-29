import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ViewVotesSheet } from '../ViewVotesSheet';

const mockPoll = {
  id: 'poll-1',
  question: 'Tabs or Spaces?',
  options: [
    { id: 'opt-1', text: 'Tabs', voterIds: ['user-1'] },
    { id: 'opt-2', text: 'Spaces', voterIds: ['user-2'] }
  ],
  allowMultipleChoices: false,
  creatorId: 'user-1',
  totalGroupParticipants: 4,
  createdAt: '2023-01-01T00:00:00Z'
};

const mockUsers = {
  'user-1': { id: 'user-1', name: 'Alice', avatarUrl: 'https://example.com/alice.png' },
  'user-2': { id: 'user-2', name: 'Bob' }
};

describe('ViewVotesSheet', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <ViewVotesSheet poll={mockPoll} users={mockUsers} onClose={() => {}} />
    );
    
    expect(getByText('Poll Results')).toBeTruthy();
    expect(getByText('Tabs')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Spaces')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  it('triggers onClose when close button is pressed', () => {
    const mockClose = jest.fn();
    const { getByTestId } = render(
      <ViewVotesSheet poll={mockPoll} users={mockUsers} onClose={mockClose} />
    );
    
    fireEvent.press(getByTestId('close-sheet-button'));
    expect(mockClose).toHaveBeenCalled();
  });
});
