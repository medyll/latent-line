import { describe, it, expect } from 'vitest';
import { stepFrame, jumpHome, jumpEnd } from './use-playback';

describe('use-playback utilities', () => {
  it('steps forward and backward and clamps', () => {
    expect(stepFrame(10, -1, 100)).toBe(9);
    expect(stepFrame(0, -1, 100)).toBe(0);
    expect(stepFrame(99, 1, 100)).toBe(100);
    expect(stepFrame(100, 1, 100)).toBe(100);
  });

  it('jumpHome and jumpEnd', () => {
    expect(jumpHome()).toBe(0);
    expect(jumpEnd(200)).toBe(200);
  });
});
