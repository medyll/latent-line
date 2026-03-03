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

  it('timeline is now an array of events with numeric time', () => {
    const m = buildDefaultModel();
    expect(Array.isArray(m.timeline)).toBe(true);
    if (m.timeline.length > 0) {
      expect(typeof m.timeline[0].time).toBe('number');
      expect(m.timeline[0].frame).toBeTruthy();
    }
  });

  // AUDIT-007: Path traversal validation
  describe('isUrlOrFile validation', () => {
    it('should reject path traversal attempts with ..', () => {
      const invalid = {
        ...buildDefaultModel(),
        assets: {
          ...buildDefaultModel().assets,
          audio: [{ id: 'a1', url: '../../../etc/passwd.wav' }]
        }
      };
      const result = modelSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors?.assets).toBeTruthy();
    });

    it('should reject null bytes in asset URLs', () => {
      const invalid = {
        ...buildDefaultModel(),
        assets: {
          ...buildDefaultModel().assets,
          audio: [{ id: 'a1', url: 'asset\0malicious.wav' }]
        }
      };
      const result = modelSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should accept valid absolute URLs', () => {
      const valid = {
        ...buildDefaultModel(),
        assets: {
          ...buildDefaultModel().assets,
          audio: [{ id: 'a1', url: 'https://example.com/soundtrack.wav' }]
        }
      };
      const result = modelSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should accept valid local filenames', () => {
      const valid = {
        ...buildDefaultModel(),
        assets: {
          ...buildDefaultModel().assets,
          audio: [{ id: 'a1', url: 'assets/soundtrack.wav' }]
        }
      };
      const result = modelSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  // AUDIT-014: Test character validation
  describe('character validation', () => {
    it('should require character id', () => {
      const invalid = {
        ...buildDefaultModel(),
        assets: {
          ...buildDefaultModel().assets,
          characters: [
            {
              name: 'Hero',
              references: [{ url: 'face.jpg', context: 'face', weight: 1.0 }]
            }
          ]
        }
      };
      const result = modelSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should allow optional voice_id and outfits', () => {
      const valid = {
        ...buildDefaultModel(),
        assets: {
          ...buildDefaultModel().assets,
          characters: [
            {
              id: 'char_minimal',
              name: 'Minimal Character',
              references: [{ url: 'minimal.jpg', context: 'reference', weight: 1.0 }]
            }
          ]
        }
      };
      const result = modelSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  // AUDIT-008: Speech/text validation
  describe('speech validation', () => {
    it('should accept speech with mood and style', () => {
      const m = buildDefaultModel();
      const actor = m.timeline[0].frame.actors?.[0];
      if (actor) {
        expect(actor.speech?.text).toBeDefined();
        expect(actor.speech?.mood).toBeDefined();
        expect(actor.speech?.style).toBeDefined();
      }
      const result = modelSchema.safeParse(m);
      expect(result.success).toBe(true);
    });

    it('should validate mood enum values', () => {
      const invalid = {
        ...buildDefaultModel(),
        timeline: [
          {
            time: 0,
            frame: {
              actors: [
                {
                  id: 'char_01',
                  speech: { text: 'Hello', mood: 'invalid_mood' }
                }
              ]
            }
          }
        ]
      };
      const result = modelSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
