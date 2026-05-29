import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PollCreation } from '../PollCreation';

describe('PollCreation', () => {
  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <PollCreation onSubmit={() => {}} onCancel={() => {}} creatorId="user-1" totalGroupParticipants={10} />
    );
    expect(getByText('Create Poll')).toBeTruthy();
    expect(getByPlaceholderText('Ask a question')).toBeTruthy();
  });

  it('allows adding and removing options', () => {
    const { getByTestId, queryByTestId } = render(
      <PollCreation onSubmit={() => {}} onCancel={() => {}} creatorId="user-1" totalGroupParticipants={10} />
    );
    
    // Initially 2 options
    expect(getByTestId('poll-option-input-0')).toBeTruthy();
    expect(getByTestId('poll-option-input-1')).toBeTruthy();
    
    // Add option
    fireEvent.press(getByTestId('add-option-button'));
    expect(getByTestId('poll-option-input-2')).toBeTruthy();
    
    // Remove option
    fireEvent.press(getByTestId('remove-option-2'));
    expect(queryByTestId('poll-option-input-2')).toBeNull();
  });

  it('submits valid poll data', () => {
    const mockSubmit = jest.fn();
    const { getByTestId, getByPlaceholderText } = render(
      <PollCreation onSubmit={mockSubmit} onCancel={() => {}} creatorId="user-1" totalGroupParticipants={10} />
    );
    
    fireEvent.changeText(getByPlaceholderText('Ask a question'), 'What is your favorite color?');
    fireEvent.changeText(getByTestId('poll-option-input-0'), 'Red');
    fireEvent.changeText(getByTestId('poll-option-input-1'), 'Blue');
    
    fireEvent.press(getByTestId('submit-poll-button'));
    
    expect(mockSubmit).toHaveBeenCalledWith({
      question: 'What is your favorite color?',
      options: [
        { id: 'opt-0', text: 'Red', voterIds: [] },
        { id: 'opt-1', text: 'Blue', voterIds: [] }
      ],
      allowMultipleChoices: false,
      creatorId: 'user-1',
      totalGroupParticipants: 10
    });
  });
});
