import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ClassicInbox from '../ClassicInbox';

describe('ClassicInbox', () => {
  it('renders category buttons and email list', () => {
    const { getByText, getAllByA11yRole } = render(<ClassicInbox />);
    expect(getByText('Inbox')).toBeTruthy();
    expect(getByText('Primary')).toBeTruthy();
    expect(getByText('Promotions')).toBeTruthy();
    expect(getByText('Updates')).toBeTruthy();

    const emailButtons = getAllByA11yRole('button').filter(
      (el) => el.props.accessibilityLabel && el.props.accessibilityLabel.startsWith('Email from')
    );
    expect(emailButtons.length).toBeGreaterThan(0);
  });

  it('filters emails by category', () => {
    const { getByText, queryByText } = render(<ClassicInbox />);
    fireEvent.press(getByText('Promotions'));
    expect(getByText('Amazon Deals')).toBeTruthy();
    expect(queryByText('Alice Johnson')).toBeNull();
  });

  it('filters emails by search text', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<ClassicInbox />);
    fireEvent.changeText(getByPlaceholderText('Search mail'), 'github');
    expect(getByText('GitHub')).toBeTruthy();
    expect(queryByText('Alice Johnson')).toBeNull();
  });
});
