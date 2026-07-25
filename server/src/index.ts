/**
 * HTTP render gateway and WebSocket collaboration server for Latent-line.
 *
 * Handles real-time multi-user editing with:
 * - Room-based connections
 * - Message broadcasting
 * - Presence tracking
 * - Heartbeat/ping-pong
 */

import { createServer } from 'node:http';
import path from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { ComfyClient } from './comfy-client';
import { JobStore } from './job-store';
import { RenderGateway } from './render-gateway';
import { WorkflowRegistry } from './workflow-registry';
import { RoomManager } from './room-manager';
import {
	createMessage,
	serializeMessage,
	parseMessage,
	type WSMessage,
	type UserInfo
} from './protocol';

const PORT = parseInt(process.env.PORT || '8080', 10);
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
if (process.env.NODE_ENV === 'production' && !process.env.RENDER_API_TOKEN) {
	throw new Error('RENDER_API_TOKEN is required in production');
}
const workflowDirectory = path.resolve(
	process.env.RENDER_WORKFLOW_DIR || path.join(process.cwd(), 'workflows')
);
const jobStoreFile = path.resolve(
	process.env.RENDER_JOB_STORE || path.join(process.cwd(), 'data', 'render-jobs.json')
);
const workflowRegistry = new WorkflowRegistry(workflowDirectory);
const jobStore = new JobStore(jobStoreFile);
await Promise.all([workflowRegistry.load(), jobStore.load()]);

const renderGateway = new RenderGateway({
	client: new ComfyClient({
		baseUrl: process.env.COMFYUI_URL || 'http://127.0.0.1:8188',
		timeoutMs: parsePositiveInteger(process.env.COMFYUI_TIMEOUT_MS, 15_000)
	}),
	registry: workflowRegistry,
	store: jobStore,
	apiToken: process.env.RENDER_API_TOKEN,
	allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5167')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean),
	maxActiveJobs: parsePositiveInteger(process.env.RENDER_MAX_ACTIVE_JOBS, 2),
	maxBodyBytes: parsePositiveInteger(process.env.RENDER_MAX_BODY_BYTES, 20_000_000)
});

const server = createServer(async (request, response) => {
	try {
		if (await renderGateway.handle(request, response)) return;
		if (request.url === '/health') {
			response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
			response.end(JSON.stringify({ status: 'ok' }));
			return;
		}
		response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
		response.end(JSON.stringify({ error: 'Not found' }));
	} catch (error) {
		console.error('HTTP request failed:', error);
		if (!response.headersSent) {
			response.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
		}
		response.end(JSON.stringify({ error: 'Internal server error' }));
	}
});
const wss = new WebSocketServer({ noServer: true });
const roomManager = new RoomManager();

server.on('upgrade', (request, socket, head) => {
	const pathname = new URL(request.url || '/', `http://localhost:${PORT}`).pathname;
	if (pathname !== '/' && pathname !== '/collaboration') {
		socket.destroy();
		return;
	}
	wss.handleUpgrade(request, socket, head, (ws) => {
		wss.emit('connection', ws, request);
	});
});

server.listen(PORT, () => {
	console.log(`Latent-line server listening on http://127.0.0.1:${PORT}`);
	console.log(`Loaded ${workflowRegistry.list().length} render workflow(s)`);
	if (!process.env.RENDER_API_TOKEN) {
		console.warn('RENDER_API_TOKEN is unset; render API authentication is disabled');
	}
});

// Heartbeat tracking
const heartbeats = new WeakMap<WebSocket, boolean>();

wss.on('connection', (ws, req) => {
	console.log('New connection');

	// Initialize heartbeat
	heartbeats.set(ws, true);

	// Extract user info from query params (simple auth for now)
	const url = new URL(req.url || '', `http://localhost:${PORT}`);
	const userId = url.searchParams.get('userId') || `user_${Date.now()}`;
	const roomId = url.searchParams.get('roomId');

	if (!roomId) {
		ws.send(
			serializeMessage(
				createMessage('error', '', userId, {
					code: 'MISSING_ROOM',
					message: 'roomId query parameter is required'
				})
			)
		);
		ws.close(1008, 'Missing roomId');
		return;
	}

	// Handle messages
	ws.on('message', (data) => {
		try {
			const message = parseMessage(data.toString());
			handleMessage(ws, message, userId, roomId);
		} catch (err) {
			console.error('Invalid message:', err);
			ws.send(
				serializeMessage(
					createMessage('error', roomId, userId, {
						code: 'INVALID_MESSAGE',
						message: err instanceof Error ? err.message : 'Unknown error'
					})
				)
			);
		}
	});

	// Handle disconnect
	ws.on('close', () => {
		console.log(`User ${userId} disconnected from room ${roomId}`);
		roomManager.removeMember(roomId, userId);

		// Broadcast leave to room
		roomManager.broadcast(
			roomId,
			createMessage('presence', roomId, userId, {
				users: roomManager.getRoomUsers(roomId)
			})
		);
	});

	// Handle errors
	ws.on('error', (err) => {
		console.error(`WebSocket error for user ${userId}:`, err);
	});

	// Send pong response
	ws.on('pong', () => {
		heartbeats.set(ws, true);
	});
});

// Heartbeat interval — close stale connections
const heartbeatTimer = setInterval(() => {
	wss.clients.forEach((ws) => {
		if (heartbeats.get(ws) === false) {
			console.log('Closing stale connection');
			return ws.terminate();
		}
		heartbeats.set(ws, false);
		ws.ping();
	});
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
	clearInterval(heartbeatTimer);
});

/**
 * Handle incoming message
 */
function handleMessage(ws: WebSocket, message: WSMessage, userId: string, roomId: string): void {
	switch (message.type) {
		case 'join': {
			const payload = message.payload;
			const userInfo: UserInfo = {
				id: userId,
				name: typeof payload?.userName === 'string' ? payload.userName : `User ${userId.slice(-4)}`,
				color: typeof payload?.userColor === 'string' ? payload.userColor : '#3b82f6',
				avatar: typeof payload?.avatar === 'string' ? payload.avatar : undefined,
				lastSeen: Date.now()
			};

			roomManager.addMember(roomId, userId, ws, userInfo);

			// Send current presence to joining user
			ws.send(
				serializeMessage(
					createMessage('presence', roomId, 'server', {
						users: roomManager.getRoomUsers(roomId)
					})
				)
			);

			// Broadcast join to others
			roomManager.broadcast(
				roomId,
				createMessage('presence', roomId, userId, {
					users: roomManager.getRoomUsers(roomId)
				}),
				userId
			);

			console.log(`User ${userInfo.name} joined room ${roomId}`);
			break;
		}

		case 'update': {
			// Broadcast update to all other users in room
			roomManager.broadcast(roomId, message, userId);

			// Send ack to sender
			ws.send(
				serializeMessage(
					createMessage('ack', roomId, 'server', {
						messageId: message.id || '',
						status: 'ok'
					})
				)
			);
			break;
		}

		case 'leave': {
			roomManager.removeMember(roomId, userId);
			roomManager.broadcast(
				roomId,
				createMessage('presence', roomId, userId, {
					users: roomManager.getRoomUsers(roomId)
				})
			);
			break;
		}

		case 'heartbeat': {
			// Respond with heartbeat ack
			ws.send(
				serializeMessage(
					createMessage('heartbeat', roomId, 'server', {
						timestamp: Date.now()
					})
				)
			);
			break;
		}

		default:
			console.warn(`Unknown message type: ${message.type}`);
	}
}

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received, shutting down...');
	wss.close(() => {
		server.close(() => {
			console.log('Server closed');
			process.exit(0);
		});
	});
});

process.on('SIGINT', () => {
	console.log('SIGINT received, shutting down...');
	wss.close(() => {
		server.close(() => {
			console.log('Server closed');
			process.exit(0);
		});
	});
});

function parsePositiveInteger(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export { server, wss, roomManager, renderGateway, workflowRegistry, jobStore };
