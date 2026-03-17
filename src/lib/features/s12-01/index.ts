/**
 * S12-01 feature stub
 *
 * Export minimal API used by higher-level components while the story is
 * implemented. Keep this intentionally small and well-typed so it's safe to
 * import elsewhere.
 */

export type S1201Result = {
  ok: boolean;
  message: string;
};

export function runS1201(): S1201Result {
  return { ok: true, message: 'S12-01 placeholder implementation' };
}

export default runS1201;

// Create a sample timeline event object based on the default model template.
export function createSampleEvent(timeOffset = 60, actorId = 'char_01') {
  // keep a minimal, serializable event shape
  return {
    time: timeOffset,
    frame: {
      actors: [
        {
          id: actorId,
          action: 'idle',
          position: { x: 0.5, y: 0.5 }
        }
      ]
    }
  } as const;
}

