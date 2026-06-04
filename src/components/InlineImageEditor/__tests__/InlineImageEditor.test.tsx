import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { InlineImageEditor } from '../InlineImageEditor';

describe('InlineImageEditor', () => {
  const originalImageUri = 'file://mock/image.jpg';

  it('renders correctly', () => {
    const { getByTestId } = render(
      <InlineImageEditor
        originalImageUri={originalImageUri}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(getByTestId('preview-image')).toBeTruthy();
  });

  it('handles rotation and undo/redo correctly', () => {
    const { getByTestId } = render(
      <InlineImageEditor
        originalImageUri={originalImageUri}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const rotateBtn = getByTestId('rotate-btn');
    const undoBtn = getByTestId('undo-btn');
    const redoBtn = getByTestId('redo-btn');
    const previewImage = getByTestId('preview-image');

    // Initial state: rotation 0
    expect(previewImage.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ transform: [{ rotate: '0deg' }] })])
    );

    // Rotate
    fireEvent.press(rotateBtn);
    expect(previewImage.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ transform: [{ rotate: '90deg' }] })])
    );

    // Undo
    fireEvent.press(undoBtn);
    expect(previewImage.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ transform: [{ rotate: '0deg' }] })])
    );

    // Redo
    fireEvent.press(redoBtn);
    expect(previewImage.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ transform: [{ rotate: '90deg' }] })])
    );
  });

  it('calls onSave with a new uri keeping original intact', () => {
    const mockOnSave = jest.fn();
    const { getByTestId } = render(
      <InlineImageEditor
        originalImageUri={originalImageUri}
        onSave={mockOnSave}
        onCancel={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('rotate-btn'));
    fireEvent.press(getByTestId('save-btn'));

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    const savedUri = mockOnSave.mock.calls[0][0];
    expect(savedUri).not.toBe(originalImageUri);
    expect(savedUri).toContain('edited');
  });

  it('calls onCancel when cancel is pressed', () => {
    const mockOnCancel = jest.fn();
    const { getByTestId } = render(
      <InlineImageEditor
        originalImageUri={originalImageUri}
        onSave={jest.fn()}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.press(getByTestId('cancel-btn'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
