import { formatTime } from '../utils/formatTime';

describe('formatTime', () => {
  it('formats milliseconds to MM:SS', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(1000)).toBe('00:01');
    expect(formatTime(60000)).toBe('01:00');
    expect(formatTime(65000)).toBe('01:05');
    expect(formatTime(3599000)).toBe('59:59');
  });

  it('handles negative or invalid inputs', () => {
    expect(formatTime(-100)).toBe('00:00');
    expect(formatTime(NaN)).toBe('00:00');
  });
});
