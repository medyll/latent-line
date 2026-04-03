/**
 * Room Manager — handles WebSocket connections grouped by room
 */

import { WebSocket } from 'ws';
import type { UserInfo } from './protocol';
import { createMessage, serializeMessage } from './protocol';

export interface RoomMember {
  ws: WebSocket;
  userInfo: UserInfo;
  connectedAt: number;
}

export interface Room {
  id: string;
  members: Map<string, RoomMember>;
  createdAt: number;
}

export class RoomManager {
  private rooms = new Map<string, Room>();

  /**
   * Get or create a room
   */
  getOrCreateRoom(roomId: string): Room {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        members: new Map(),
        createdAt: Date.now()
      });
    }
    return this.rooms.get(roomId)!;
  }

  /**
   * Add a member to a room
   */
  addMember(roomId: string, userId: string, ws: WebSocket, userInfo: UserInfo): void {
    const room = this.getOrCreateRoom(roomId);
    room.members.set(userId, {
      ws,
      userInfo,
      connectedAt: Date.now()
    });
  }

  /**
   * Remove a member from a room
   */
  removeMember(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.members.delete(userId);
      // Clean up empty rooms
      if (room.members.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  /**
   * Get all user info in a room
   */
  getRoomUsers(roomId: string): UserInfo[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.members.values()).map((m) => m.userInfo);
  }

  /**
   * Get member by user ID
   */
  getMember(roomId: string, userId: string): RoomMember | undefined {
    const room = this.rooms.get(roomId);
    return room?.members.get(userId);
  }

  /**
   * Broadcast a message to all members in a room (optionally excluding one)
   */
  broadcast(roomId: string, message: object, excludeUserId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const data = typeof message === 'string' ? message : serializeMessage(message as any);

    for (const [userId, member] of room.members) {
      if (userId === excludeUserId) continue;
      if (member.ws.readyState === 1) { // WebSocket.OPEN
        member.ws.send(data);
      }
    }
  }

  /**
   * Get room count
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Get total connected users
   */
  getTotalUsers(): number {
    let count = 0;
    for (const room of this.rooms.values()) {
      count += room.members.size;
    }
    return count;
  }

  /**
   * Get all room IDs
   */
  getRoomIds(): string[] {
    return Array.from(this.rooms.keys());
  }

  /**
   * Check if room exists
   */
  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  /**
   * Delete a room (disconnects all members)
   */
  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      for (const member of room.members.values()) {
        member.ws.close(1001, 'Room deleted');
      }
      this.rooms.delete(roomId);
    }
  }
}
