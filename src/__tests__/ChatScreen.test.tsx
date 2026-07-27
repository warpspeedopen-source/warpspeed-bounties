import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ChatScreen } from '../screens/ChatScreen';

describe('ChatScreen', () => {
  it('sends and displays text messages', () => {
    const { getByPlaceholderText, getByText } = render(<ChatScreen />);
    const input = getByPlaceholderText('Type a message');
    fireEvent.changeText(input, 'Hello world');
    fireEvent.press(getByText('Send'));
    expect(getByText('Hello world')).toBeTruthy();
  });

  it('creates and displays a poll', async () => {
    const { getByLabelText, getByText, queryByText } = render(<ChatScreen />);
    fireEvent.press(getByLabelText('Create poll'));
    fireEvent.changeText(getByLabelText('Poll question'), 'Best pet?');
    fireEvent.changeText(getByLabelText('Option 1'), 'Dog');
    fireEvent.changeText(getByLabelText('Option 2'), 'Cat');
    fireEvent.press(getByText('Create Poll'));
    await waitFor(() => expect(queryByText('Best pet?')).toBeTruthy());
  });

  it('votes on a poll option', async () => {
    const { getByLabelText, getByText } = render(<ChatScreen />);
    fireEvent.press(getByLabelText('Create poll'));
    fireEvent.changeText(getByLabelText('Poll question'), 'Best fruit?');
    fireEvent.changeText(getByLabelText('Option 1'), 'Apple');
    fireEvent.changeText(getByLabelText('Option 2'), 'Banana');
    fireEvent.press(getByText('Create Poll'));
    await waitFor(() => expect(getByText('Best fruit?')).toBeTruthy());
    fireEvent.press(getByText('Apple'));
    expect(getByText('1 vote')).toBeTruthy();
  });
});
