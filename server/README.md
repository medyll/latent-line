# Latent-line Collaboration Server

WebSocket server for real-time multi-user editing in Latent-line.

## Features

- **Room-based connections** — Users join rooms by ID
- **Message broadcasting** — Updates sent to all room members
- **Presence tracking** — Know who's editing with you
- **Heartbeat/ping-pong** — Automatic stale connection cleanup
- **Simple auth** — User info via query parameters

## Quick Start

```bash
# Install dependencies
pnpm install

# Development (with hot reload)
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start
```

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `PORT` | `8080` | Server port |

## Connection

Connect via WebSocket with query parameters:

```
ws://localhost:8080?roomId=my-room&userId=user123
```

## Message Protocol

All messages are JSON with this structure:

```json
{
  "type": "join|leave|update|sync|presence|error|heartbeat|ack",
  "roomId": "string",
  "userId": "string",
  "payload": {},
  "timestamp": 1234567890,
  "id": "optional_unique_id"
}
```

### Message Types

| Type | Direction | Description |
|------|-----------|-------------|
| `join` | Client → Server | Join a room with user info |
| `leave` | Client → Server | Leave a room |
| `update` | Client → Server | Send model patch |
| `presence` | Server → Client | List of users in room |
| `ack` | Server → Client | Acknowledge message |
| `error` | Server → Client | Error occurred |
| `heartbeat` | Both | Keep-alive ping/pong |

## Tests

```bash
pnpm test
```

## Architecture

```
server/
├── src/
│   ├── index.ts           # WebSocket server entry point
│   ├── room-manager.ts    # Room lifecycle management
│   ├── protocol.ts        # Message types and serialization
│   └── *.test.ts          # Unit tests
├── package.json
└── tsconfig.json
```
