import { describe, it, expect } from 'vitest';
import { seekFromPixel } from './playback';

describe('scrubbing mapping', () => {
  it('maps 120px at 24px/frame to frame 5', () => {
    expect(seekFromPixel(120, 24)).toBe(5);
  });
});
