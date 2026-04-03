/**
 * WebSocket Message Protocol for Latent-line Collaboration
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

export interface LeavePayload {
  reason?: string;
}

export interface UpdatePayload {
  patch: ModelPatch;
  version: number;
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

export interface PresencePayload {
  users: UserInfo[];
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

export interface ErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AckPayload {
  messageId: string;
  status: 'ok' | 'error';
  error?: string;
}

/**
 * Create a new message
 */
export function createMessage(
  type: MessageType,
  roomId: string,
  userId: string,
  payload?: Record<string, unknown>
): WSMessage {
  return {
    type,
    roomId,
    userId,
    payload,
    timestamp: Date.now(),
    id: `${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  };
}

/**
 * Serialize message to JSON string
 */
export function serializeMessage(msg: WSMessage): string {
  return JSON.stringify(msg);
}

/**
 * Parse message from JSON string
 */
export function parseMessage(data: string): WSMessage {
  const msg = JSON.parse(data) as WSMessage;
  if (!msg.type || !msg.roomId || !msg.userId) {
    throw new Error('Invalid message: missing required fields');
  }
  return msg;
}
