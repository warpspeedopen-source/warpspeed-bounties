import React from 'react';
import { create } from 'react-test-renderer';
import { AudioRecorder } from '../components/AudioRecorder';

jest.mock('../services/AudioService', () => ({
  AudioService: {
    startRecording: jest.fn(),
    pauseRecording: jest.fn(),
    resumeRecording: jest.fn(),
    stopRecording: jest.fn().mockResolvedValue({
      id: 'test-id',
      uri: 'file://mock.m4a',
      durationMs: 2000,
      createdAt: 1000,
      status: 'saved',
    }),
    cancelRecording: jest.fn(),
  }
}));

describe('AudioRecorder', () => {
  it('renders correctly', () => {
    const tree = create(<AudioRecorder onSave={jest.fn()} onCancel={jest.fn()} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
