# Architecture Map

Aura is split across two main runtime surfaces:

- `server/`
  Python backend, agent orchestration, job lifecycle, prompts, skills catalog state
- `vscode_extension/`
  VS Code extension, chat webview, WebSocket driver, local filesystem bridge, UI state

## Core flow

1. User sends a message from the VS Code webview.
2. Extension sends HTTP request to the server and keeps a WebSocket driver connected.
3. Server creates or reuses a chat history and enqueues an agent job.
4. Worker runs the agent in the background and uses the WebSocket driver for file tools and live status.
5. Extension receives job events and updates the chat UI.

## Skills flow

1. Extension scans the user skill root.
2. Extension sends the skill catalog snapshot to the server.
3. Server stores the catalog per `client_id`.
4. Requests can activate skills manually or automatically.
5. Server reads actual `SKILL.md` content lazily from the client when needed.

## Typical change buckets

- Prompt behavior:
  `server/src/egomnia_agents/`
- Agent routing and request bootstrap:
  `server/src/routers/agent/`
- Background execution and job events:
  `server/src/services/agent_worker_service.py`
- Skills catalog and resolver:
  `server/src/skills/`
- Webview UI:
  `vscode_extension/src/chatViewProvider.ts`
- Extension driver and protocol:
  `vscode_extension/src/websocketManager.ts`
