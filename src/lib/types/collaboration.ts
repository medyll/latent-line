/**
 * Collaboration types — shared between client and server
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
