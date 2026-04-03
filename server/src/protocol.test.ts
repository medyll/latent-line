import { describe, it, expect } from 'vitest';
import {
  createMessage,
  serializeMessage,
  parseMessage
} from './protocol';

describe('createMessage', () => {
  it('creates a message with all fields', () => {
    const msg = createMessage('join', 'room1', 'user1', { name: 'Alice' });
    expect(msg.type).toBe('join');
    expect(msg.roomId).toBe('room1');
    expect(msg.userId).toBe('user1');
    expect(msg.payload).toEqual({ name: 'Alice' });
    expect(msg.timestamp).toBeDefined();
    expect(msg.id).toBeDefined();
  });

  it('creates message without payload', () => {
    const msg = createMessage('heartbeat', 'room1', 'user1');
    expect(msg.payload).toBeUndefined();
  });

  it('generates unique IDs', () => {
    const msg1 = createMessage('update', 'room1', 'user1');
    const msg2 = createMessage('update', 'room1', 'user1');
    expect(msg1.id).not.toBe(msg2.id);
  });
});

describe('serializeMessage', () => {
  it('serializes message to JSON string', () => {
    const msg = createMessage('join', 'room1', 'user1', { name: 'Alice' });
    const json = serializeMessage(msg);
    expect(typeof json).toBe('string');

    const parsed = JSON.parse(json);
    expect(parsed.type).toBe('join');
    expect(parsed.roomId).toBe('room1');
  });
});

describe('parseMessage', () => {
  it('parses valid message', () => {
    const json = JSON.stringify({
      type: 'join',
      roomId: 'room1',
      userId: 'user1',
      payload: { name: 'Alice' },
      timestamp: Date.now()
    });

    const msg = parseMessage(json);
    expect(msg.type).toBe('join');
    expect(msg.roomId).toBe('room1');
    expect(msg.userId).toBe('user1');
  });

  it('throws on missing type', () => {
    const json = JSON.stringify({
      roomId: 'room1',
      userId: 'user1'
    });

    expect(() => parseMessage(json)).toThrow('Invalid message');
  });

  it('throws on missing roomId', () => {
    const json = JSON.stringify({
      type: 'join',
      userId: 'user1'
    });

    expect(() => parseMessage(json)).toThrow('Invalid message');
  });

  it('throws on missing userId', () => {
    const json = JSON.stringify({
      type: 'join',
      roomId: 'room1'
    });

    expect(() => parseMessage(json)).toThrow('Invalid message');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseMessage('not json')).toThrow();
  });
});
