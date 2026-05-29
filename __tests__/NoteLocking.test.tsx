import React from 'react';
import { render } from '@testing-library/react-native';
import { LockedNoteVault } from '../src/components/LockedNoteVault';
import { Text } from 'react-native';

// Mock the hook and services
jest.mock('../src/hooks/useNoteLock', () => ({
  useNoteLock: () => ({
    isAuthenticated: false,
    authenticate: jest.fn(),
    lockSettings: { enabled: true, method: 'pin' },
  }),
}));

describe('LockedNoteVault', () => {
  it('renders locked state when note is locked and not authenticated', () => {
    const { getByText } = render(
      <LockedNoteVault 
        noteContent={<Text>Secret Content</Text>} 
        isNoteLocked={true} 
      />
    );
    
    expect(getByText('This note is locked 🔒')).toBeTruthy();
    expect(() => getByText('Secret Content')).toThrow();
  });
});
