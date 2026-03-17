import { describe, it, expect } from 'vitest';
import { createSampleEvent } from './index';

describe('createSampleEvent', () => {
  it('creates an event with default time and actor', () => {
    const ev = createSampleEvent();
    expect(ev).toHaveProperty('time');
    expect(ev.time).toBe(60);
    expect(ev.frame.actors[0].id).toBe('char_01');
  });

  it('respects provided parameters', () => {
    const ev = createSampleEvent(120, 'char_99');
    expect(ev.time).toBe(120);
    expect(ev.frame.actors[0].id).toBe('char_99');
  });
});
