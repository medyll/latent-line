/**
 * Sync Engine — Conflict-free Model Synchronization
 *
 * Handles patch-based updates, offline queue, and replay on reconnect.
 */

import type { ModelPatch, PatchOperation } from '$lib/types/collaboration';

export interface SyncState {
  localVersion: number;
  remoteVersion: number;
  isSyncing: boolean;
  isConnected: boolean;
}

export class SyncEngine {
  private localVersion = 0;
  private remoteVersion = 0;
  private offlineQueue: ModelPatch[] = [];
  private pendingAcks = new Set<string>();
  private sendPatchCallback: ((patch: ModelPatch) => void) | null = null;
  private applyPatchCallback: ((patch: ModelPatch) => void) | null = null;
  private stateChangeCallback: ((state: SyncState) => void) | null = null;
  private _isConnected = false;

  constructor() {}

  /**
   * Set callback for sending patches to server
   */
  setOnSendPatch(callback: (patch: ModelPatch) => void): void {
    this.sendPatchCallback = callback;
  }

  /**
   * Set callback for applying patches to local model
   */
  setOnApplyPatch(callback: (patch: ModelPatch) => void): void {
    this.applyPatchCallback = callback;
  }

  /**
   * Set callback for state changes
   */
  setOnStateChange(callback: (state: SyncState) => void): void {
    this.stateChangeCallback = callback;
  }

  /**
   * Create a patch from local changes and send it
   */
  createAndSendPatch(operations: PatchOperation[]): ModelPatch | null {
    const patch: ModelPatch = {
      id: `patch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: 'local',
      version: this.localVersion + 1,
      timestamp: Date.now(),
      operations
    };

    this.localVersion++;
    this.pendingAcks.add(patch.id);

    if (this.sendPatchCallback) {
      this.sendPatchCallback(patch);
    }

    // If offline, queue the patch
    if (!this._isConnected) {
      this.offlineQueue.push(patch);
    }

    this.notifyStateChange();
    return patch;
  }

  /**
   * Apply a remote patch
   */
  applyRemotePatch(patch: ModelPatch): boolean {
    // Check version ordering
    if (patch.version <= this.remoteVersion) {
      // Already applied or outdated
      return false;
    }

    if (this.applyPatchCallback) {
      this.applyPatchCallback(patch);
    }

    this.remoteVersion = patch.version;

    // Remove from pending acks if it was ours
    this.pendingAcks.delete(patch.id);

    this.notifyStateChange();
    return true;
  }

  /**
   * Acknowledge a patch was received by server
   */
  acknowledgePatch(patchId: string): void {
    this.pendingAcks.delete(patchId);
    this.notifyStateChange();
  }

  /**
   * Set connection status and handle reconnect
   */
  setConnected(connected: boolean): void {
    this._isConnected = connected;

    if (connected && this.offlineQueue.length > 0) {
      this.replayOfflineQueue();
    }

    this.notifyStateChange();
  }

  /**
   * Replay queued patches on reconnect
   */
  private replayOfflineQueue(): void {
    for (const patch of this.offlineQueue) {
      if (this.sendPatchCallback) {
        this.sendPatchCallback(patch);
      }
    }
    this.offlineQueue = [];
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return {
      localVersion: this.localVersion,
      remoteVersion: this.remoteVersion,
      isSyncing: this.pendingAcks.size > 0,
      isConnected: this._isConnected
    };
  }

  /**
   * Get offline queue
   */
  getOfflineQueue(): ModelPatch[] {
    return [...this.offlineQueue];
  }

  /**
   * Get pending acks count
   */
  getPendingAcksCount(): number {
    return this.pendingAcks.size;
  }

  /**
   * Reset sync state
   */
  reset(): void {
    this.localVersion = 0;
    this.remoteVersion = 0;
    this.offlineQueue = [];
    this.pendingAcks.clear();
    this._isConnected = false;
    this.notifyStateChange();
  }

  /**
   * Notify state change callback
   */
  private notifyStateChange(): void {
    if (this.stateChangeCallback) {
      this.stateChangeCallback(this.getState());
    }
  }
}

/**
 * Create a patch operation
 */
export function createPatchOperation(
  op: PatchOperation['op'],
  path: string,
  value?: unknown,
  from?: string
): PatchOperation {
  return { op, path, value, from };
}

/**
 * Apply a patch operation to an object
 */
export function applyOperation(obj: Record<string, unknown>, operation: PatchOperation): void {
  const parts = operation.path.split('/').filter(Boolean);
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastPart = parts[parts.length - 1];

  switch (operation.op) {
    case 'add':
    case 'replace':
      current[lastPart] = operation.value;
      break;
    case 'remove':
      delete current[lastPart];
      break;
    case 'move':
      if (operation.from) {
        const fromParts = operation.from.split('/').filter(Boolean);
        let fromObj = obj;
        for (let i = 0; i < fromParts.length - 1; i++) {
          fromObj = fromObj[fromParts[i]] as Record<string, unknown>;
        }
        const fromLast = fromParts[fromParts.length - 1];
        const value = fromObj[fromLast];
        delete fromObj[fromLast];
        current[lastPart] = value;
      }
      break;
  }
}
