/**
 * WebSocket Collaboration Server for Latent-line
 *
 * Handles real-time multi-user editing with:
 * - Room-based connections
 * - Message broadcasting
 * - Presence tracking
 * - Heartbeat/ping-pong
 */

import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager } from './room-manager';
import {
  createMessage,
  serializeMessage,
  parseMessage,
  type WSMessage,
  type JoinPayload,
  type UserInfo
} from './protocol';

const PORT = parseInt(process.env.PORT || '8080', 10);
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

const wss = new WebSocketServer({ port: PORT });
const roomManager = new RoomManager();

console.log(`Collaboration server listening on port ${PORT}`);

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
    const users = roomManager.getRoomUsers(roomId);
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
      const payload = message.payload as JoinPayload;
      const userInfo: UserInfo = {
        id: userId,
        name: payload.userName || `User ${userId.slice(-4)}`,
        color: payload.userColor || '#3b82f6',
        avatar: payload.avatar,
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
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { wss, roomManager };
