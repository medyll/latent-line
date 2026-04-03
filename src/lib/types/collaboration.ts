/**
 * Collaboration types — shared between client and server
 */

export type MessageType =
  | 'join'
  | 'leave'
  | 'update'
  | 'sync'
  | 'presence'
  | 'error'
  | 'heartbeat'
  | 'ack';

export interface WSMessage {
  type: MessageType;
  roomId: string;
  userId: string;
  payload?: Record<string, unknown>;
  timestamp: number;
  id?: string;
}

export interface JoinPayload {
  userName: string;
  userColor: string;
  avatar?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  lastSeen: number;
  selection?: {
    type: 'event' | 'asset';
    id: string;
  };
  isTyping?: boolean;
}

export interface ModelPatch {
  id: string;
  userId: string;
  version: number;
  timestamp: number;
  operations: PatchOperation[];
}

export interface PatchOperation {
  op: 'add' | 'remove' | 'replace' | 'move';
  path: string;
  value?: unknown;
  from?: string;
}
