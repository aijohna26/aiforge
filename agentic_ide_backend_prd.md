
# PRD: Agentic IDE Backend (Kilo + Claude)  
**Version:** 1.0  
**Owner:** Engineering  
**Scope:** Backend only  
**Focus:** Kilo-powered agentic coding backend for browser IDE

---

# 1. Product Overview

We are building the backend for an **Agentic IDE**: a browser-based coding environment powered by **Kilo (open-source agentic coder)** and **Claude Sonnet 4.5**.  
Users can:

- Write/edit code in a browser IDE  
- Run AI coding commands  
- Generate full React Native & Web apps  
- Preview apps in Web + Expo  
- Pay using a **credit-based token system**

The backend handles:

- Workspaces per project (Git-backed)
- AI command execution (Kilo → Claude → file edits)
- Preview server integration
- File APIs for the editor
- Credit metering and usage tracking
- Job queue + concurrency control

This PRD describes the full backend system.

---

# 2. Goals

### Primary Goals
1. Provide a scalable backend for executing AI coding actions via Kilo.
2. Maintain safe multi-file code edits via Git-managed workspaces.
3. Expose APIs for file management, AI commands, logs, diffs, and previews.
4. Implement a credit/usage system to charge users per AI request.
5. Stream real-time updates (logs, status, diffs) to the frontend.

### Secondary Goals
- Support Expo mobile preview (Metro bundler).
- Support Web preview (Vite/Next).
- Enable multi-file creation and refactoring.
- Provide deterministic results via job queues & project-level mutex.

---

# 3. Non-Goals

- Not building a GitHub/Bitbucket clone.
- Not building our own LLM.
- Not implementing full real-time collaboration (future).
- Not replacing Kilo’s agentic capabilities—only orchestrating it.

---

# 4. System Architecture

```
Browser IDE
│   ├── Chat (AI commands)
│   ├── File Explorer
│   ├── Code Editor
│   └── Live Preview (Web/Device)
│
▼ HTTP + WebSocket
Backend API (Node + TypeScript)
│   ├── File APIs
│   ├── AI Command API
│   ├── Credit/Wallet API
│   ├── Project Workspace Manager
│   └── Git Service
│
▼ Job Queue (BullMQ/Redis)
AI Worker
│   ├── Executes Kilo CLI
│   ├── Calls Claude Sonnet 4.5
│   ├── Applies diffs to workspace
│   └── Streams logs + updates
│
▼
Project Workspace
│   ├── repo/ (bare git repo)
│   └── worktree/ (editable code)
│
▼ File Watchers
Web Dev Server (Vite/Next)
Expo Dev Server (Metro)
```

---

# 5. Core Backend Features

## 5.1 Project Workspace Management

Each project has:

```
/srv/projects/<projectId>/
  repo/        # bare git repository
  worktree/    # active working directory used by IDE, Kilo, dev servers
```

### Requirements
- Worktree is the single source of truth for code.
- All manual edits go directly into worktree.
- All AI edits occur in worktree but on a special branch:
  ```
  ai/session-<id>
  ```
- Git is used for:
  - snapshotting file changes
  - diff generation
  - rollback
  - conflict resolution

---

## 5.2 File API (Editor Integration)

### Endpoints
**GET /projects/:id/files**  
Return full file list.

**GET /projects/:id/files/<path>**  
Return file content + SHA.

**PUT /projects/:id/files/<path>**  
Save user edits into worktree & commit.

### Requirements
- Sanitize paths (no ../).
- Auto-commit on save.
- Trigger dev server reload.

---

## 5.3 AI Command System

User enters an instruction in chat:

> “Add a shopping list screen with categories”

Backend processes:

1. Validate user wallet has enough credits.
2. Reserve credits.
3. Enqueue job into BullMQ.
4. Worker executes:
   - Kilo CLI inside project worktree
   - Kilo calls Claude Sonnet
   - Multi-step agent reasoning
   - File edits applied
5. Worker collects token usage.
6. Worker settles final credit usage.
7. Worker streams logs & diffs.

### Endpoint
**POST /projects/:id/ai-command**

Payload:
```json
{
  "text": "Add login screen",
  "mode": "coder",
  "currentFilePath": "app/index.tsx"
}
```

Response:
```json
{
  "jobId": "abc123",
  "status": "queued",
  "creditsReserved": 10
}
```

---

## 5.4 AI Worker

Responsibilities:

- Run Kilo CLI via `spawn`
- Provide prompt via stdin
- Capture:
  - stdout logs
  - stderr logs
  - file changes
- Intercept Claude usage per request
- Generate git diffs
- Send updates to frontend via websocket

### Worker Lifecycle
1. Checkout or create `ai/session-<id>` branch.
2. Run Kilo:
   ```
   npx kilocode run --mode coder
   ```
3. Pass user prompt to Kilo.
4. Kilo communicates with Claude.
5. Kilo writes file edits.
6. Worker commits changes.
7. Worker merges to main or holds for review.
8. Worker emits final status.

---

## 5.5 Credit-Based Usage System

### Wallet Table
- `userId`
- `balance`

### Credit Flow
1. User buys credits.
2. Before AI job:
   - Estimate cost.
   - Reserve credits.
3. After job:
   - Calculate actual cost from Claude tokens.
   - Refund unused reserved credits.

---

## 5.6 Dev Server Integration

### Web Preview
- Vite or Next.js runs with:
  ```
  cwd = project.worktree
  ```
- Any file change triggers HMR auto-refresh.

### Device Preview
- Expo Metro bundler runs with:
  ```
  cwd = project.worktree
  ```
- UI provides:
  - Device preview iframe
  - QR code for mobile

---

## 5.7 WebSocket Event System

Events pushed to UI:

- `job:queued`
- `job:running`
- `job:log`
- `job:file-created`
- `job:file-updated`
- `job:diff`
- `job:success`
- `job:error`
- `job:credits-used`

---

# 6. API Specification Summary

| Endpoint | Description |
|---------|-------------|
| `POST /projects` | Create new project |
| `GET /projects/:id/files` | List files |
| `GET /projects/:id/files/<path>` | Get file |
| `PUT /projects/:id/files/<path>` | Save file |
| `POST /projects/:id/ai-command` | Run AI job |
| `GET /wallet` | Get user balance |
| `POST /wallet/purchase` | Add credits |
| `GET /jobs/:id` | Get job details |

---

# 7. Security Requirements

- AI can only modify files inside workspace.
- Path sanitization on all file operations.
- Claude API key stored server-side only.
- Jobs run in isolated worker processes.
- Git branch isolation for AI edits.

---

# 8. Scalability Requirements

- Horizontal scaling of workers.
- Project-level mutex: only one AI job at a time per project.
- Redis-backed queue.
- Dev servers run per active project.
- File operations must be atomic.

---

# 9. Failure Handling

Types:
- LLM failure
- Kilo failure
- Git merge conflicts
- Syntax/bundle errors

Actions:
- Return logs to UI
- Refund credits
- Keep branch for manual fix
- Allow retry

---

# 10. Roadmap

### MVP
- File APIs
- AI command system
- Kilo execution
- Claude integration
- Credit reservation + deduction
- Web preview
- Basic Expo preview

### V1
- Diff viewer
- PR/merge UI
- Token analytics
- Memory-based project recall
- Cached embeddings for project-wide context

### V2
- Multi-user collaboration
- Branch management UI
- Deploy-to-store tools
- Automatic testing & CI pipeline
- Custom local agent (replace Kilo)

---

# End of PRD
