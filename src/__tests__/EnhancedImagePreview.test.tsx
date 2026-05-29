import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EnhancedImagePreview } from '../EnhancedImagePreview';

describe('EnhancedImagePreview', () => {
  const mockImages = [
    { id: '1', uri: 'https://example.com/1.jpg' },
    { id: '2', uri: 'https://example.com/2.jpg' }
  ];

  it('renders nothing when not visible', () => {
    const { toJSON } = render(
      <EnhancedImagePreview images={mockImages} visible={false} onRequestClose={() => {}} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders correctly when visible', () => {
    const { getByText } = render(
      <EnhancedImagePreview images={mockImages} visible={true} onRequestClose={() => {}} />
    );
    expect(getByText('1 / 2')).toBeTruthy();
    expect(getByText('Close')).toBeTruthy();
  });

  it('calls onRequestClose when close button is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <EnhancedImagePreview images={mockImages} visible={true} onRequestClose={onClose} />
    );
    fireEvent.press(getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
