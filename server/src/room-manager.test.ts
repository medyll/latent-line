import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from './room-manager';
import { createMessage, serializeMessage } from './protocol';

describe('RoomManager', () => {
  let manager: RoomManager;

  beforeEach(() => {
    manager = new RoomManager();
  });

  describe('getOrCreateRoom', () => {
    it('creates a new room', () => {
      const room = manager.getOrCreateRoom('room1');
      expect(room.id).toBe('room1');
      expect(room.members.size).toBe(0);
    });

    it('returns existing room if already created', () => {
      const room1 = manager.getOrCreateRoom('room1');
      const room2 = manager.getOrCreateRoom('room1');
      expect(room1).toBe(room2);
    });
  });

  describe('addMember', () => {
    it('adds a member to a room', () => {
      const mockWs = { readyState: 1 } as any;
      manager.addMember('room1', 'user1', mockWs, {
        id: 'user1',
        name: 'Alice',
        color: '#ff0000',
        lastSeen: Date.now()
      });

      const users = manager.getRoomUsers('room1');
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Alice');
    });

    it('adds multiple members to same room', () => {
      const mockWs1 = { readyState: 1 } as any;
      const mockWs2 = { readyState: 1 } as any;

      manager.addMember('room1', 'user1', mockWs1, {
        id: 'user1',
        name: 'Alice',
        color: '#ff0000',
        lastSeen: Date.now()
      });
      manager.addMember('room1', 'user2', mockWs2, {
        id: 'user2',
        name: 'Bob',
        color: '#00ff00',
        lastSeen: Date.now()
      });

      const users = manager.getRoomUsers('room1');
      expect(users).toHaveLength(2);
    });
  });

  describe('removeMember', () => {
    it('removes a member from a room', () => {
      const mockWs = { readyState: 1 } as any;
      manager.addMember('room1', 'user1', mockWs, {
        id: 'user1',
        name: 'Alice',
        color: '#ff0000',
        lastSeen: Date.now()
      });

      manager.removeMember('room1', 'user1');
      const users = manager.getRoomUsers('room1');
      expect(users).toHaveLength(0);
    });

    it('deletes empty rooms', () => {
      const mockWs = { readyState: 1 } as any;
      manager.addMember('room1', 'user1', mockWs, {
        id: 'user1',
        name: 'Alice',
        color: '#ff0000',
        lastSeen: Date.now()
      });

      manager.removeMember('room1', 'user1');
      expect(manager.hasRoom('room1')).toBe(false);
    });
  });

  describe('broadcast', () => {
    it('sends message to all members', () => {
      const sent: string[] = [];
      const mockWs1 = {
        readyState: 1,
        send: (data: string) => sent.push(data)
      } as any;
      const mockWs2 = {
        readyState: 1,
        send: (data: string) => sent.push(data)
      } as any;

      manager.addMember('room1', 'user1', mockWs1, {
        id: 'user1',
        name: 'Alice',
        color: '#ff0000',
        lastSeen: Date.now()
      });
      manager.addMember('room1', 'user2', mockWs2, {
        id: 'user2',
        name: 'Bob',
        color: '#00ff00',
        lastSeen: Date.now()
      });

      const msg = createMessage('update', 'room1', 'user1', { test: true });
      manager.broadcast('room1', msg);

      expect(sent).toHaveLength(2);
    });

    it('excludes specified user from broadcast', () => {
      const sent: string[] = [];
      const mockWs1 = {
        readyState: 1,
        send: (data: string) => sent.push(data)
      } as any;
      const mockWs2 = {
        readyState: 1,
        send: (data: string) => sent.push(data)
      } as any;

      manager.addMember('room1', 'user1', mockWs1, {
        id: 'user1',
        name: 'Alice',
        color: '#ff0000',
        lastSeen: Date.now()
      });
      manager.addMember('room1', 'user2', mockWs2, {
        id: 'user2',
        name: 'Bob',
        color: '#00ff00',
        lastSeen: Date.now()
      });

      const msg = createMessage('update', 'room1', 'user1', { test: true });
      manager.broadcast('room1', msg, 'user1');

      expect(sent).toHaveLength(1);
    });

    it('does not send to closed connections', () => {
      const sent: string[] = [];
      const mockWs1 = {
        readyState: 3, // CLOSED
        send: (data: string) => sent.push(data)
      } as any;
      const mockWs2 = {
        readyState: 1,
        send: (data: string) => sent.push(data)
      } as any;

      manager.addMember('room1', 'user1', mockWs1, {
        id: 'user1',
        name: 'Alice',
        color: '#ff0000',
        lastSeen: Date.now()
      });
      manager.addMember('room1', 'user2', mockWs2, {
        id: 'user2',
        name: 'Bob',
        color: '#00ff00',
        lastSeen: Date.now()
      });

      const msg = createMessage('update', 'room1', 'user1', { test: true });
      manager.broadcast('room1', msg);

      expect(sent).toHaveLength(1);
    });
  });

  describe('stats', () => {
    it('returns correct room count', () => {
      manager.getOrCreateRoom('room1');
      manager.getOrCreateRoom('room2');
      expect(manager.getRoomCount()).toBe(2);
    });

    it('returns correct total users', () => {
      const mockWs1 = { readyState: 1 } as any;
      const mockWs2 = { readyState: 1 } as any;

      manager.addMember('room1', 'user1', mockWs1, {
        id: 'user1',
        name: 'Alice',
        color: '#ff0000',
        lastSeen: Date.now()
      });
      manager.addMember('room2', 'user2', mockWs2, {
        id: 'user2',
        name: 'Bob',
        color: '#00ff00',
        lastSeen: Date.now()
      });

      expect(manager.getTotalUsers()).toBe(2);
    });

    it('returns all room IDs', () => {
      manager.getOrCreateRoom('room1');
      manager.getOrCreateRoom('room2');
      const ids = manager.getRoomIds();
      expect(ids).toContain('room1');
      expect(ids).toContain('room2');
    });
  });

  describe('deleteRoom', () => {
    it('closes all connections and removes room', () => {
      const closed: number[] = [];
      const mockWs = {
        readyState: 1,
        close: (code: number) => closed.push(code)
      } as any;

      manager.addMember('room1', 'user1', mockWs, {
        id: 'user1',
        name: 'Alice',
        color: '#ff0000',
        lastSeen: Date.now()
      });

      manager.deleteRoom('room1');
      expect(manager.hasRoom('room1')).toBe(false);
      expect(closed).toContain(1001);
    });
  });
});
