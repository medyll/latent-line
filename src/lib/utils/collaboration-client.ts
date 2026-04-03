/**
 * Collaboration Client for Latent-line frontend
 *
 * Connects to the WebSocket collaboration server
 * and handles real-time sync.
 */

import type {
  WSMessage,
  UserInfo,
  JoinPayload,
  ModelPatch
} from '$lib/types/collaboration';

export type MessageHandler = (message: WSMessage) => void;

export interface CollaborationClientOptions {
  serverUrl?: string;
  userId: string;
  userName: string;
  userColor: string;
}

export class CollaborationClient {
  private ws: WebSocket | null = null;
  private roomId: string | null = null;
  private options: CollaborationClientOptions;
  private handlers = new Map<string, Set<MessageHandler>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(options: CollaborationClientOptions) {
    this.options = options;
  }

  /**
   * Connect to a room
   */
  async connect(roomId: string): Promise<void> {
    this.roomId = roomId;
    this.reconnectAttempts = 0;

    return new Promise((resolve, reject) => {
      const url = new URL(this.options.serverUrl || 'ws://localhost:8080');
      url.searchParams.set('roomId', roomId);
      url.searchParams.set('userId', this.options.userId);

      this.ws = new WebSocket(url.toString());

      this.ws.onopen = () => {
        console.log(`Connected to room ${roomId}`);
        this.reconnectAttempts = 0;

        // Send join message
        const joinPayload: JoinPayload = {
          userName: this.options.userName,
          userColor: this.options.userColor
        };
        this.send({
          type: 'join',
          roomId,
          userId: this.options.userId,
          payload: joinPayload,
          timestamp: Date.now(),
          id: `${this.options.userId}_${Date.now()}`
        });
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as WSMessage;
          this.handleMessage(message);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        reject(err);
      };

      this.ws.onclose = (event) => {
        console.log(`Disconnected from room ${roomId}: ${event.reason}`);
        this.roomId = null;
        this.attemptReconnect();
      };
    });
  }

  /**
   * Disconnect from the room
   */
  disconnect(): void {
    if (this.roomId && this.ws) {
      this.send({
        type: 'leave',
        roomId: this.roomId,
        userId: this.options.userId,
        payload: { reason: 'User disconnected' },
        timestamp: Date.now()
      });
    }
    this.ws?.close();
    this.ws = null;
    this.roomId = null;
  }

  /**
   * Send a model update
   */
  sendUpdate(patch: ModelPatch, version: number): void {
    if (!this.roomId) return;

    this.send({
      type: 'update',
      roomId: this.roomId,
      userId: this.options.userId,
      payload: { patch, version },
      timestamp: Date.now()
    });
  }

  /**
   * Register a message handler
   */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  /**
   * Send a raw message
   */
  private send(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WSMessage): void {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(message);
      }
    }
  }

  /**
   * Attempt to reconnect after disconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.roomId) {
        this.connect(this.roomId).catch(console.error);
      }
    }, delay);
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current room ID
   */
  get currentRoom(): string | null {
    return this.roomId;
  }
}
