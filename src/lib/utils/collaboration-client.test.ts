import { describe, it, expect } from 'vitest';
import { CollaborationClient } from '$lib/utils/collaboration-client';

describe('CollaborationClient', () => {
	it('creates a client with options', () => {
		const client = new CollaborationClient({
			userId: 'user1',
			userName: 'Alice',
			userColor: '#ff0000'
		});
		expect(client).toBeDefined();
		expect(client.isConnected).toBe(false);
		expect(client.currentRoom).toBeNull();
	});

	it('disconnects without error when not connected', () => {
		const client = new CollaborationClient({
			userId: 'user1',
			userName: 'Alice',
			userColor: '#ff0000'
		});
		expect(() => client.disconnect()).not.toThrow();
	});

	it('registers message handlers', () => {
		const client = new CollaborationClient({
			userId: 'user1',
			userName: 'Alice',
			userColor: '#ff0000'
		});

		let called = false;
		const unsubscribe = client.on('presence', () => {
			called = true;
		});

		expect(typeof unsubscribe).toBe('function');
	});
});
