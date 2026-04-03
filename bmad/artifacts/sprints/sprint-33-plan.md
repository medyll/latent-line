# Sprint 33 Plan — Real-time Collaboration Foundation

**Version:** v0.9.0  
**Theme:** Collaboration  
**Points:** 14  
**Duration:** 2.5 weeks (2026-04-27 → 2026-05-15)  
**Status:** Pending

---

## Overview

Sprint 33 introduces **real-time collaboration** allowing multiple users to edit the same timeline simultaneously. This is a foundational sprint for team-based workflows.

---

## Stories

### S33-01: WebSocket Server Foundation (5 points) — P0

**Status:** Pending  
**Priority:** P0

#### Description
Build WebSocket server backend for real-time collaboration.

#### Features
- WebSocket server (Node.js + ws)
- Room-based connections
- Authentication via JWT
- Message protocol (join, leave, update, sync)
- Heartbeat/ping-pong for connection health
- Graceful disconnect handling

#### Acceptance Criteria
- [ ] Server runs on port 8080
- [ ] Clients can join rooms by ID
- [ ] Broadcast messages to room members
- [ ] Handle disconnect gracefully
- [ ] JWT authentication
- [ ] Unit tests (10+)
- [ ] Integration tests (5+)
- [ ] Docker support

#### Technical Design

**Server Structure:**
```
server/
├── src/
│   ├── index.ts              # Server entry point
│   ├── websocket-server.ts   # WebSocket handling
│   ├── room-manager.ts       # Room lifecycle
│   ├── message-protocol.ts   # Message types
│   ├── auth.ts               # JWT verification
│   └── heartbeat.ts          # Ping/pong
├── package.json
└── Dockerfile
```

**Message Protocol:**
```typescript
interface WSMessage {
  type: 'join' | 'leave' | 'update' | 'sync' | 'presence' | 'error';
  roomId: string;
  userId: string;
  payload?: any;
  timestamp: number;
}

interface JoinMessage extends WSMessage {
  type: 'join';
  payload: {
    userName: string;
    userColor: string;
  };
}

interface UpdateMessage extends WSMessage {
  type: 'update';
  payload: {
    patch: ModelPatch;
    version: number;
  };
}
```

**Server Implementation:**
```typescript
// websocket-server.ts
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

class CollaborationServer {
  private wss: WebSocketServer;
  private rooms: Map<string, Room>;
  
  broadcast(roomId: string, message: WSMessage, exclude?: string) {
    // Send to all in room except exclude
  }
  
  handleConnection(ws: WebSocket, token: string) {
    // Authenticate and setup handlers
  }
}
```

#### Implementation Plan

**Day 1-2: Server Setup**
- [ ] Initialize server project
- [ ] WebSocketServer setup
- [ ] Basic connection handling
- [ ] Room manager implementation

**Day 3-4: Message Protocol**
- [ ] Define message types
- [ ] Join/leave handlers
- [ ] Broadcast logic
- [ ] Error handling

**Day 5: Authentication**
- [ ] JWT verification
- [ ] Token generation on client
- [ ] User session management

**Day 6-7: Health & Tests**
- [ ] Heartbeat implementation
- [ ] Unit tests (10+)
- [ ] Integration tests (5+)
- [ ] Docker configuration

---

### S33-02: Multi-user Presence System (5 points) — P1

**Status:** Pending  
**Priority:** P1

#### Description
Show who else is editing the timeline with presence indicators.

#### Features
- PresencePanel component showing user list
- Avatars with colors and initials
- Current selection indicators on timeline
- "Typing" indicators when editing
- Join/leave toast notifications
- User count badge

#### Acceptance Criteria
- [ ] PresencePanel component
- [ ] User list with colors
- [ ] Selection cursors on timeline
- [ ] Toast on join/leave
- [ ] Typing indicator
- [ ] Unit tests (6+)
- [ ] E2E test (multi-user presence)

#### Technical Design

**New Files:**
```
src/lib/components/app/PresencePanel.svelte    (~150 lines)
src/lib/components/app/UserAvatar.svelte       (~60 lines)
src/lib/components/app/SelectionCursor.svelte  (~50 lines)
src/lib/utils/collaboration-client.ts          (~150 lines)
```

**Presence State:**
```typescript
interface PresenceState {
  roomId: string;
  users: Map<string, UserInfo>;
  currentUser: string;
}

interface UserInfo {
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
```

**Selection Cursor:**
```svelte
<!-- SelectionCursor.svelte -->
<div 
  class="selection-cursor" 
  style="border-left-color: {user.color}"
  aria-label="{user.name} is viewing {selectionId}"
>
  <span class="cursor-label">{user.name}</span>
</div>
```

#### Implementation Plan

**Day 1-2: Collaboration Client**
- [ ] Create collaboration-client.ts
- [ ] connect(roomId) method
- [ ] sendUpdate(patch) method
- [ ] onPresence(callback) listener
- [ ] disconnect() cleanup

**Day 3-4: Presence Panel**
- [ ] Create PresencePanel.svelte
- [ ] User list rendering
- [ ] Avatar component
- [ ] Color coding

**Day 5: Selection Cursors**
- [ ] SelectionCursor component
- [ ] Broadcast selection changes
- [ ] Render other users' cursors

**Day 6: Notifications & Tests**
- [ ] Toast on join/leave
- [ ] Typing indicator
- [ ] Unit tests (6+)
- [ ] E2E test

---

### S33-03: Conflict-free Model Sync (4 points) — P0

**Status:** Pending  
**Priority:** P0

#### Description
Sync model changes between users without conflicts using patch-based updates.

#### Features
- Operational Transform or CRDT-lite approach
- Patch-based updates (not full model)
- Undo/Redo across network
- Offline queue + replay on reconnect
- Version vector for ordering

#### Acceptance Criteria
- [ ] Patch format defined
- [ ] Apply patches to local model
- [ ] Queue offline changes
- [ ] Replay on reconnect
- [ ] Version tracking
- [ ] Unit tests (12+)

#### Technical Design

**Patch Format:**
```typescript
// src/lib/model/model-patch.ts
export type PatchOperation = 'add' | 'remove' | 'replace' | 'move';

export interface ModelPatch {
  id: string; // patch_001
  userId: string;
  version: number;
  timestamp: number;
  operations: PatchOperation[];
}

export interface PatchOperation {
  op: PatchOperation;
  path: string; // JSON Pointer: "/timeline/0/frame/camera/zoom"
  value?: any;
  from?: string; // for move
}
```

**Sync Engine:**
```typescript
// src/lib/utils/sync-engine.ts
class SyncEngine {
  private localVersion: number;
  private remoteVersion: number;
  private offlineQueue: ModelPatch[];
  
  applyPatch(patch: ModelPatch): void {
    // Validate version, apply, update state
  }
  
  queuePatch(patch: ModelPatch): void {
    // Add to offline queue
  }
  
  async replayOnReconnect(): Promise<void> {
    // Send queued patches on reconnect
  }
  
  undo(): ModelPatch | null {
    // Generate undo patch
  }
}
```

#### Implementation Plan

**Day 1-2: Patch System**
- [ ] Define patch types
- [ ] createPatch() function
- [ ] applyPatch() function
- [ ] validatePatch() function
- [ ] Unit tests (6+)

**Day 3: Sync Engine**
- [ ] Create sync-engine.ts
- [ ] Version tracking
- [ ] Patch application order

**Day 4: Offline Support**
- [ ] Offline queue
- [ ] Reconnect logic
- [ ] Replay mechanism

**Day 5: Undo/Redo Network**
- [ ] Broadcast undo as patch
- [ ] Handle remote undo
- [ ] Unit tests (6+)

---

## Technical Debt

- [ ] Add connection status indicator
- [ ] Handle server restart gracefully
- [ ] Document message protocol

---

## Testing Plan

### Unit Tests (28 total)
- websocket-server.test.ts (10 tests)
- room-manager.test.ts (5 tests)
- collaboration-client.test.ts (6 tests)
- sync-engine.test.ts (7 tests)

### Integration Tests (5 total)
- multi-user-join.spec.ts
- patch-broadcast.spec.ts
- offline-replay.spec.ts
- presence-update.spec.ts
- disconnect-reconnect.spec.ts

### E2E Tests (2 total)
- collaboration-basic.spec.ts (2 users)
- collaboration-presence.spec.ts

---

## Infrastructure

### Server Deployment

**Development:**
```bash
cd server
pnpm install
pnpm run dev  # port 8080
```

**Production (Docker):**
```bash
docker build -t latent-line-collab .
docker run -p 8080:8080 latent-line-collab
```

**Environment Variables:**
```
JWT_SECRET=your-secret-key
PORT=8080
CORS_ORIGIN=http://localhost:5167
```

---

## Definition of Done

- [ ] All stories complete
- [ ] 28+ unit tests passing
- [ ] 7 E2E/integration tests passing
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Prettier format passes
- [ ] Manual QA pass (2 users)
- [ ] Server Docker image builds
- [ ] CHANGELOG.md updated

---

## Release Notes Draft

### v0.9.0 — Real-time Collaboration

**New Features:**
- 🤝 **Real-time Collaboration** — Multiple users can edit the same timeline
- 👥 **Presence System** — See who's editing with you, view their selections
- 🔄 **Live Sync** — Changes sync instantly across all connected users
- 💾 **Offline Support** — Work offline, sync reconnects automatically

**Technical:**
- WebSocket server (Node.js + ws)
- Room-based architecture
- Patch-based model sync
- JWT authentication

**Setup:**
```bash
# Start collaboration server
cd server && pnpm run dev

# Connect in app
Settings → Collaboration → Connect
```

---

**Created:** 2026-04-02  
**Sprint Start:** 2026-04-27  
**Sprint End:** 2026-05-15
