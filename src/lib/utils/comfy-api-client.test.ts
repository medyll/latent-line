import { describe, it, expect, beforeEach } from 'vitest';
import { ComfyApiClient } from '$lib/utils/comfy-api-client';

describe('ComfyApiClient', () => {
  let client: ComfyApiClient;

  beforeEach(() => {
    client = new ComfyApiClient('http://localhost:8188', 'test-client');
  });

  describe('constructor', () => {
    it('creates a client with defaults', () => {
      const defaultClient = new ComfyApiClient();
      expect(defaultClient).toBeDefined();
    });

    it('creates a client with custom options', () => {
      expect(client).toBeDefined();
    });
  });

  describe('disconnect', () => {
    it('disconnects without error', () => {
      expect(() => client.disconnect()).not.toThrow();
    });
  });

  describe('onProgress', () => {
    it('registers progress callback', () => {
      let called = false;
      const unsubscribe = client.onProgress(() => {
        called = true;
      });

      expect(typeof unsubscribe).toBe('function');
    });

    it('returns unsubscribe function', () => {
      const unsubscribe = client.onProgress(() => {});
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('onComplete', () => {
    it('registers complete callback', () => {
      let called = false;
      const unsubscribe = client.onComplete(() => {
        called = true;
      });

      expect(typeof unsubscribe).toBe('function');
    });
  });
});
