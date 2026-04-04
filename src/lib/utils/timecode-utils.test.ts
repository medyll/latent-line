import { describe, it, expect } from 'vitest';
import {
  msToTimecode,
  formatTimecode,
  timecodeToMs,
  parseTimecode,
  msToFrames,
  framesToMs,
  formatDuration
} from '$lib/utils/timecode-utils';
import type { FrameRate } from '$lib/utils/timecode-utils';

describe('msToTimecode', () => {
  it('converts milliseconds to timecode at 24fps', () => {
    const tc = msToTimecode(1000, 24);
    expect(tc.hours).toBe(0);
    expect(tc.minutes).toBe(0);
    expect(tc.seconds).toBe(1);
    expect(tc.frames).toBe(0);
  });

  it('converts milliseconds to timecode at 30fps', () => {
    const tc = msToTimecode(2000, 30);
    expect(tc.seconds).toBe(2);
    expect(tc.frames).toBe(0);
  });

  it('handles zero milliseconds', () => {
    const tc = msToTimecode(0, 24);
    expect(tc.hours).toBe(0);
    expect(tc.minutes).toBe(0);
    expect(tc.seconds).toBe(0);
    expect(tc.frames).toBe(0);
  });

  it('handles large values', () => {
    const tc = msToTimecode(3661000, 24); // 1h 1m 1s
    expect(tc.hours).toBe(1);
    expect(tc.minutes).toBe(1);
    expect(tc.seconds).toBe(1);
    expect(tc.frames).toBe(0);
  });
});

describe('formatTimecode', () => {
  it('formats timecode with padding', () => {
    const tc = { hours: 1, minutes: 2, seconds: 3, frames: 4 };
    expect(formatTimecode(tc)).toBe('01:02:03:04');
  });

  it('formats zero timecode', () => {
    const tc = { hours: 0, minutes: 0, seconds: 0, frames: 0 };
    expect(formatTimecode(tc)).toBe('00:00:00:00');
  });
});

describe('timecodeToMs', () => {
  it('converts timecode to milliseconds at 24fps', () => {
    const tc = { hours: 0, minutes: 0, seconds: 1, frames: 0 };
    const ms = timecodeToMs(tc, 24);
    expect(ms).toBeCloseTo(1000, 0);
  });

  it('converts timecode to milliseconds at 30fps', () => {
    const tc = { hours: 0, minutes: 0, seconds: 1, frames: 0 };
    const ms = timecodeToMs(tc, 30);
    expect(ms).toBeCloseTo(1000, 0);
  });

  it('roundtrips correctly', () => {
    const originalMs = 5000;
    const tc = msToTimecode(originalMs, 24);
    const roundtripMs = timecodeToMs(tc, 24);
    expect(roundtripMs).toBeCloseTo(originalMs, 0);
  });
});

describe('parseTimecode', () => {
  it('parses valid timecode string', () => {
    const tc = parseTimecode('01:02:03:04', 24);
    expect(tc.hours).toBe(1);
    expect(tc.minutes).toBe(2);
    expect(tc.seconds).toBe(3);
    expect(tc.frames).toBe(4);
  });

  it('throws on invalid format', () => {
    expect(() => parseTimecode('invalid', 24)).toThrow();
  });

  it('throws on frames exceeding frame rate', () => {
    expect(() => parseTimecode('00:00:00:30', 24)).toThrow();
  });
});

describe('msToFrames', () => {
  it('converts milliseconds to frames', () => {
    expect(msToFrames(1000, 24)).toBe(24);
    expect(msToFrames(1000, 30)).toBe(30);
  });
});

describe('framesToMs', () => {
  it('converts frames to milliseconds', () => {
    expect(framesToMs(24, 24)).toBeCloseTo(1000, 0);
    expect(framesToMs(30, 30)).toBeCloseTo(1000, 0);
  });
});

describe('formatDuration', () => {
  it('formats duration as timecode', () => {
    expect(formatDuration(1000)).toBe('00:00:01:00');
  });
});
