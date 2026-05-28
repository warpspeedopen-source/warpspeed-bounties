import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ClassicInbox } from './ClassicInbox';

describe('ClassicInbox', () => {
  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<ClassicInbox />);
    expect(getByText('Inbox')).toBeTruthy();
    expect(getByPlaceholderText('Search emails...')).toBeTruthy();
  });

  it('renders mock emails', () => {
    const { getByText } = render(<ClassicInbox />);
    expect(getByText('Welcome to the team!')).toBeTruthy();
  });

  it('switches categories', () => {
    const { getByText, queryByText } = render(<ClassicInbox />);
    // By default on primary
    expect(getByText('Welcome to the team!')).toBeTruthy();
    expect(queryByText('50% off all shoes!')).toBeNull();

    // Switch to promotions
    fireEvent.press(getByText('Promotions'));
    expect(getByText('50% off all shoes!')).toBeTruthy();
    expect(queryByText('Welcome to the team!')).toBeNull();
  });
});
