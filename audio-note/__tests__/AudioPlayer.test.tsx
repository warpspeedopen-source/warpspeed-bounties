import React from 'react';
import { create } from 'react-test-renderer';
import { AudioPlayer } from '../components/AudioPlayer';

jest.mock('../services/AudioService', () => ({
  AudioService: {
    play: jest.fn(),
    pause: jest.fn(),
    seek: jest.fn(),
  }
}));

describe('AudioPlayer', () => {
  it('renders correctly and displays duration', () => {
    const tree = create(<AudioPlayer uri="test.m4a" durationMs={60000} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
