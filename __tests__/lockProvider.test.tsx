import React from 'react';
import { render, act } from '@testing-library/react-native';
import { LockProvider, useLock } from '../src/context/LockProvider';
import { Text, Button } from 'react-native';

const TestComponent = () => {
  const { lockNote, unlockNote, isLocked } = useLock();

  return (
    <>
      <Text testID="status">{isLocked('test') ? 'locked' : 'unlocked'}</Text>
      <Button title="Lock" onPress={() => lockNote('test')} />
      <Button title="Unlock" onPress={() => unlockNote('test')} />
    </>
  );
};

describe('LockProvider', () => {
  it('locks and unlocks a note', async () => {
    const { getByText, getByTestId } = render(
      <LockProvider>
        <TestComponent />
      </LockProvider>
    );

    expect(getByTestId('status').children[0]).toBe('unlocked');

    await act(async () => {
      getByText('Lock').props.onPress();
    });
    expect(getByTestId('status').children[0]).toBe('locked');

    await act(async () => {
      getByText('Unlock').props.onPress();
    });
    expect(getByTestId('status').children[0]).toBe('unlocked');
  });
});
