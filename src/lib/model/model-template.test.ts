import { describe, it, expect } from 'vitest';
import { buildDefaultModel, createModelTemplate, modelTemplate, modelSchema } from './model-template';

describe('model-template', () => {
  it('buildDefaultModel produces a valid model (Zod)', () => {
    const m = buildDefaultModel();
    const parsed = modelSchema.safeParse(m);
    expect(parsed.success).toBe(true);
  });

  it('createModelTemplate returns a deep-cloned, valid model', () => {
    const cloned = createModelTemplate();
    // validate
    const parsed = modelSchema.safeParse(cloned);
    expect(parsed.success).toBe(true);
    // ensure deep clone: mutating clone does not change original
    const prev = modelTemplate.project.name;
    cloned.project.name = prev + '-modified';
    expect(modelTemplate.project.name).toBe(prev);
  });

  it('timeline is an array of events with numeric time', () => {
    const m = buildDefaultModel();
    expect(Array.isArray(m.timeline)).toBe(true);
    if (m.timeline.length > 0) {
      expect(typeof m.timeline[0].time).toBe('number');
      expect(m.timeline[0].frame).toBeTruthy();
    }
  });
});
