# Latent-line Server

Private ComfyUI render gateway and WebSocket collaboration server.

## Features

- **Room-based connections** — Users join rooms by ID
- **Message broadcasting** — Updates sent to all room members
- **Presence tracking** — Know who's editing with you
- **Heartbeat/ping-pong** — Automatic stale connection cleanup
- **Simple auth** — User info via query parameters
- **Versioned workflows** — Only server-installed ComfyUI graphs can run
- **Persistent render jobs** — Jobs survive browser and server restarts
- **Safe artefact proxy** — ComfyUI stays private
- **I2V uploads** — Validated PNG, JPEG and WebP source images

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

Containerised gateway:

```bash
export RENDER_API_TOKEN="replace-with-a-long-random-token"
docker compose -f docker-compose.gateway.yml up --build
```

The Compose file publishes the gateway on `127.0.0.1:8080` only. Put a
TLS-authenticating reverse proxy in front of it for remote access.

## Configuration

- `PORT=8080`: HTTP and WebSocket port.
- `COMFYUI_URL=http://127.0.0.1:8188`: private ComfyUI origin.
- `RENDER_API_TOKEN`: bearer token, mandatory in production.
- `ALLOWED_ORIGINS=http://localhost:5167`: comma-separated browser origins.
- `RENDER_WORKFLOW_DIR=./workflows`: versioned manifests and API graphs.
- `RENDER_JOB_STORE=./data/render-jobs.json`: persistent job metadata.
- `RENDER_MAX_ACTIVE_JOBS=2`: queued/running job limit.
- `RENDER_MAX_BODY_BYTES=20000000`: request and image upload limit.
- `COMFYUI_TIMEOUT_MS=15000`: upstream request timeout.

Never expose ComfyUI itself publicly. Bind it to a private interface and expose
only this gateway behind TLS. Set `RENDER_API_TOKEN` in every shared or
production environment.

## Render API

All routes require `Authorization: Bearer <RENDER_API_TOKEN>` when a token is
configured.

- `GET /api/render/health`: gateway and ComfyUI health.
- `GET /api/render/workflows`: safe workflow manifests.
- `GET /api/render/jobs`: persisted jobs.
- `POST /api/render/jobs`: submit inputs to a registered workflow.
- `GET /api/render/jobs/:id`: refresh status and outputs from ComfyUI.
- `DELETE /api/render/jobs/:id`: cancel a queued or running prompt.
- `GET /api/render/jobs/:id/artifacts/:index`: stream a declared output.
- `POST /api/render/uploads`: upload an I2V source as base64 JSON.

Example submission:

```json
{
	"workflowId": "wan21-t2v-1.3b",
	"inputs": {
		"positive_prompt": "A quiet harbour at blue hour",
		"negative_prompt": "text, watermark",
		"seed": 42,
		"width": 832,
		"height": 480,
		"frame_count": 81,
		"fps": 16
	}
}
```

See [`workflows/README.md`](workflows/README.md) for workflow installation.

## Connection

Connect via WebSocket with query parameters:

```
ws://localhost:8080/collaboration?roomId=my-room&userId=user123
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

| Type        | Direction       | Description                |
| ----------- | --------------- | -------------------------- |
| `join`      | Client → Server | Join a room with user info |
| `leave`     | Client → Server | Leave a room               |
| `update`    | Client → Server | Send model patch           |
| `presence`  | Server → Client | List of users in room      |
| `ack`       | Server → Client | Acknowledge message        |
| `error`     | Server → Client | Error occurred             |
| `heartbeat` | Both            | Keep-alive ping/pong       |

## Tests

```bash
pnpm test
```

## Architecture

```
server/
├── src/
│   ├── index.ts           # WebSocket server entry point
│   ├── render-gateway.ts  # Authenticated HTTP render API
│   ├── comfy-client.ts    # Private ComfyUI client
│   ├── workflow-registry.ts
│   ├── job-store.ts
│   ├── room-manager.ts    # Room lifecycle management
│   ├── protocol.ts        # Message types and serialization
│   └── *.test.ts          # Unit tests
├── package.json
├── workflows/             # Versioned manifests and API graphs
└── tsconfig.json
```
