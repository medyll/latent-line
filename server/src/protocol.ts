/**
 * WebSocket Message Protocol for Latent-line Collaboration
 */

/** The kinds of frame that cross the collaboration socket. */
export type MessageType =
	| 'join'
	| 'leave'
	| 'update'
	| 'sync'
	| 'presence'
	| 'error'
	| 'heartbeat'
	| 'ack';

/** Envelope every frame is wrapped in. `id` is what an `ack` refers back to. */
export interface WSMessage {
	type: MessageType;
	roomId: string;
	userId: string;
	payload?: Record<string, unknown>;
	timestamp: number;
	id?: string;
}

/** Sent on `join`: how this user should appear to the others in the room. */
export interface JoinPayload {
	userName: string;
	userColor: string;
	avatar?: string;
}

/** Sent on `leave`, with an optional reason to show the room. */
export interface LeavePayload {
	reason?: string;
}

/** Sent on `update`: the patch, and the document version it applies to. */
export interface UpdatePayload {
	patch: ModelPatch;
	version: number;
}

/** A versioned batch of edits from one user, applied atomically. */
export interface ModelPatch {
	id: string;
	userId: string;
	version: number;
	timestamp: number;
	operations: PatchOperation[];
}

/** One JSON-Patch-style edit. `from` is only used by `move`. */
export interface PatchOperation {
	op: 'add' | 'remove' | 'replace' | 'move';
	path: string;
	value?: unknown;
	from?: string;
}

/** Sent on `presence`: the full participant list for the room. */
export interface PresencePayload {
	users: UserInfo[];
}

/** One participant as broadcast in a `presence` frame, including what they have
 *  selected and whether they are typing. */
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

/** Sent on `error`. */
export interface ErrorPayload {
	code: string;
	message: string;
	details?: Record<string, unknown>;
}

/** Sent on `ack`, referring to a message by its `id`. */
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
