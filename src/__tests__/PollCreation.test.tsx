import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PollCreation } from '../components/PollCreation';

describe('PollCreation', () => {
  it('renders correctly and allows creating a poll', () => {
    const onCreate = jest.fn();
    const onCancel = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <PollCreation onCreate={onCreate} onCancel={onCancel} />
    );

    const questionInput = getByPlaceholderText('Poll question');
    fireEvent.changeText(questionInput, 'Favorite color?');

    const option1 = getByPlaceholderText('Option 1');
    const option2 = getByPlaceholderText('Option 2');
    fireEvent.changeText(option1, 'Red');
    fireEvent.changeText(option2, 'Blue');

    const createButton = getByText('Create Poll');
    fireEvent.press(createButton);

    expect(onCreate).toHaveBeenCalledWith({
      question: 'Favorite color?',
      options: ['Red', 'Blue'],
      multipleChoice: false,
    });
  });

  it('validates minimum options and question length', () => {
    const onCreate = jest.fn();
    const onCancel = jest.fn();

    const { getByText, getByPlaceholderText } = render(
      <PollCreation onCreate={onCreate} onCancel={onCancel} />
    );

    const createButton = getByText('Create Poll');
    fireEvent.press(createButton);
    expect(onCreate).not.toHaveBeenCalled();

    const questionInput = getByPlaceholderText('Poll question');
    fireEvent.changeText(questionInput, 'A'.repeat(256));
    fireEvent.press(createButton);
    expect(onCreate).not.toHaveBeenCalled();
  });
});
