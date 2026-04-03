import { describe, it, expect, beforeEach } from 'vitest';
import {
  SyncEngine,
  createPatchOperation,
  applyOperation
} from '$lib/utils/sync-engine';
import type { PatchOperation } from '$lib/types/collaboration';

describe('SyncEngine', () => {
  let engine: SyncEngine;

  beforeEach(() => {
    engine = new SyncEngine();
  });

  describe('createAndSendPatch', () => {
    it('creates a patch with incremented version', () => {
      const ops: PatchOperation[] = [
        createPatchOperation('add', '/timeline/0', { time: 0 })
      ];

      const patch = engine.createAndSendPatch(ops);
      expect(patch).toBeDefined();
      expect(patch!.version).toBe(1);

      const patch2 = engine.createAndSendPatch(ops);
      expect(patch2!.version).toBe(2);
    });

    it('adds patch to offline queue when disconnected', () => {
      engine.setConnected(false);
      const ops: PatchOperation[] = [
        createPatchOperation('add', '/timeline/0', { time: 0 })
      ];

      engine.createAndSendPatch(ops);
      expect(engine.getOfflineQueue()).toHaveLength(1);
    });

    it('calls onSendPatch callback', () => {
      let sentPatch: any = null;
      engine.setOnSendPatch((patch) => {
        sentPatch = patch;
      });

      const ops: PatchOperation[] = [
        createPatchOperation('add', '/timeline/0', { time: 0 })
      ];

      engine.createAndSendPatch(ops);
      expect(sentPatch).toBeDefined();
      expect(sentPatch.version).toBe(1);
    });
  });

  describe('applyRemotePatch', () => {
    it('applies patch and updates remote version', () => {
      let appliedPatch: any = null;
      engine.setOnApplyPatch((patch) => {
        appliedPatch = patch;
      });

      const patch = {
        id: 'patch_1',
        userId: 'remote',
        version: 1,
        timestamp: Date.now(),
        operations: []
      };

      const result = engine.applyRemotePatch(patch);
      expect(result).toBe(true);
      expect(appliedPatch).toBeDefined();

      const state = engine.getState();
      expect(state.remoteVersion).toBe(1);
    });

    it('rejects outdated patches', () => {
      const patch1 = {
        id: 'patch_1',
        userId: 'remote',
        version: 1,
        timestamp: Date.now(),
        operations: []
      };

      engine.applyRemotePatch(patch1);

      const patch2 = {
        id: 'patch_1',
        userId: 'remote',
        version: 1,
        timestamp: Date.now(),
        operations: []
      };

      const result = engine.applyRemotePatch(patch2);
      expect(result).toBe(false);
    });
  });

  describe('setConnected', () => {
    it('replays offline queue on reconnect', () => {
      let sentPatches: any[] = [];
      engine.setOnSendPatch((patch) => {
        sentPatches.push(patch);
      });

      // Go offline and queue patches
      engine.setConnected(false);
      engine.createAndSendPatch([createPatchOperation('add', '/a', 1)]);
      engine.createAndSendPatch([createPatchOperation('add', '/b', 2)]);

      expect(engine.getOfflineQueue()).toHaveLength(2);

      // Reconnect
      sentPatches = [];
      engine.setConnected(true);

      expect(engine.getOfflineQueue()).toHaveLength(0);
      expect(sentPatches).toHaveLength(2);
    });
  });

  describe('getState', () => {
    it('returns correct initial state', () => {
      const state = engine.getState();
      expect(state.localVersion).toBe(0);
      expect(state.remoteVersion).toBe(0);
      expect(state.isSyncing).toBe(false);
      expect(state.isConnected).toBe(false); // Initially disconnected
    });

    it('reflects connection status', () => {
      engine.setConnected(true);
      const state = engine.getState();
      expect(state.isConnected).toBe(true);
    });
  });

  describe('reset', () => {
    it('resets all state', () => {
      engine.setConnected(true);
      engine.createAndSendPatch([createPatchOperation('add', '/a', 1)]);

      engine.reset();

      const state = engine.getState();
      expect(state.localVersion).toBe(0);
      expect(state.remoteVersion).toBe(0);
      expect(state.isSyncing).toBe(false);
      expect(state.isConnected).toBe(false);
      expect(engine.getOfflineQueue()).toHaveLength(0);
    });
  });
});

describe('createPatchOperation', () => {
  it('creates an add operation', () => {
    const op = createPatchOperation('add', '/path', 'value');
    expect(op.op).toBe('add');
    expect(op.path).toBe('/path');
    expect(op.value).toBe('value');
  });

  it('creates a move operation with from', () => {
    const op = createPatchOperation('move', '/new', undefined, '/old');
    expect(op.op).toBe('move');
    expect(op.from).toBe('/old');
  });
});

describe('applyOperation', () => {
  it('applies add operation', () => {
    const obj: Record<string, unknown> = {};
    applyOperation(obj, createPatchOperation('add', '/key', 'value'));
    expect(obj.key).toBe('value');
  });

  it('applies replace operation', () => {
    const obj: Record<string, unknown> = { key: 'old' };
    applyOperation(obj, createPatchOperation('replace', '/key', 'new'));
    expect(obj.key).toBe('new');
  });

  it('applies remove operation', () => {
    const obj: Record<string, unknown> = { key: 'value' };
    applyOperation(obj, createPatchOperation('remove', '/key'));
    expect(obj.key).toBeUndefined();
  });

  it('applies nested operations', () => {
    const obj: Record<string, unknown> = { nested: {} };
    applyOperation(obj, createPatchOperation('add', '/nested/deep', 'value'));
    expect((obj.nested as any).deep).toBe('value');
  });
});
