import { describe, it, expect, beforeEach } from 'vitest';
import { loadModelFromLocalStorage, saveModelToLocalStorage } from './persistence';
import { modelTemplate } from '$lib/model/model-template';

// Simple localStorage mock
class LocalStorageMock {
  store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
}

beforeEach(() => {
  // @ts-ignore
  global.localStorage = new LocalStorageMock();
});

describe('persistence helpers', () => {
  it('saves and loads a valid model', () => {
    const ok = saveModelToLocalStorage(modelTemplate);
    expect(ok).toBe(true);

    const loaded = loadModelFromLocalStorage();
    expect(loaded).not.toBeNull();
    // basic sanity check
    expect((loaded as any).project?.name).toEqual(modelTemplate.project.name);
  });

  it('rejects invalid model on save and does not create storage', () => {
    const bad = { foo: 'bar' } as unknown;
    const ok = saveModelToLocalStorage(bad);
    expect(ok).toBe(false);
    const loaded = loadModelFromLocalStorage();
    expect(loaded).toBeNull();
  });
});
