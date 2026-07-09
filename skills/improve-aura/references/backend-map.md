# Backend Map

## Main areas

### Agent selection and prompt assembly

- `server/src/egomnia_agents/__init__.py`
  Agent descriptions and automatic agent selection
- `server/src/egomnia_agents/agent_manager.py`
  Builds the final agent, tools, model, and prompt
- `server/src/egomnia_agents/main_agent_prompt.txt`
  Shared operating rules for the runtime
- `server/src/egomnia_agents/agents_prompt/*.txt`
  Agent-specific behavior

### Request intake

- `server/src/routers/agent/agent_post_request.py`
  Main request orchestration:
  - user input
  - history creation
  - selected or auto skills
  - first-turn digest
  - job enqueue

### Execution runtime

- `server/src/services/agent_worker_service.py`
  Background execution, persistence, job events
- `server/src/utils/prompt_utils.py`
  Stream handling, tool call events, thinking status propagation

### Skills

- `server/src/skills/commands.py`
  Skill-specific input builders
- `server/src/skills/resolver.py`
  Auto-detection logic
- `server/src/skills/catalog.py`
  Session skill catalog

### Terminal execution from chat

- `server/src/egomnia_agents/function_tools/external_driver_function_tools.py`
  Exposes `run_terminal_command` and `stop_terminal_command` tools. Terminal
  execution is NOT handled on the backend: the tools forward the request
  over WS to the extension, which runs the command locally in the opened
  workspace and streams output back as incremental chat cards.
- `vscode_extension/src/websocketManager.ts`
  Terminal dispatcher: `workspace` vs `global` scope resolution, approval
  gating (always gated for `global` even in `auto` mode), foreground with
  bounded timeout, background sessions, stop API.
- `vscode_extension/src/chatViewProvider.ts`
  `terminalCard` chat message rendering: scope/mode badges, live
  stdout/stderr, exit code, Stop button that calls
  `WebSocketManager.stopLocalTerminalSession`. Cards are local-only; no
  dedicated backend event stream persists them.
- Runtime bundle alignment: if `npm run compile` cannot be executed, keep
  `vscode_extension/out/websocketManager.js` and
  `vscode_extension/out/chatViewProvider.js` aligned with the source edits.

### Context compaction

- `server/src/services/context_compaction_service.py`
  Two-track compaction: OpenAI native Responses compaction
  (`OpenAIResponsesCompactionSession`) vs Aura-native summary rewrite over
  the SQLite agent session for non-OpenAI providers. Exposes
  `ContextCompactionService.prepare_session` (auto) and
  `run_manual_compaction` (manual).
- `server/src/egomnia_agents/agent_manager.py`
  Calls `prepare_session` at the start of every agent run to decide whether
  the session needs pre-compaction.
- `server/src/routers/history.py`
  `POST /api/history/{history_id}/compact` — explicit backend endpoint used
  by the VS Code manual compact action; preferred over fake agent prompts.
- `server/src/config/__init__.py`
  Feature flags and thresholds: `CONTEXT_COMPACTION_ENABLED`,
  `CONTEXT_COMPACTION_NATIVE_*`, `CONTEXT_COMPACTION_SUMMARY_*`,
  trigger ratios, keep-last-N windows.
- `server/src/services/session_metrics_service.py`
  Surfaces a `compacted` flag so the VS Code composer can display the
  "Compacted" badge on the context-window strip.
- Tests: `server/tests/test_context_compaction_service.py`,
  `server/tests/test_history_compaction_endpoint.py`.

### Document agents (PDF / DOCX)

- `server/src/egomnia_agents/function_tools/document_function_tools.py`
  PDF and DOCX tools: `extract_pdf_text`, `extract_pdf_metadata`,
  `extract_docx_text`, `extract_docx_structure`, `convert_document`
- `server/src/egomnia_agents/function_tools/external_driver_function_tools.py`
  `read_file_binary` / `read_file_binary_async` helpers; the underlying WS
  call is `read_file` with `binary: true`, returning `content_base64`
- `server/src/egomnia_agents/agents_prompt/agent_pdf.txt`
- `server/src/egomnia_agents/agents_prompt/agent_docx.txt`
- Registry entries `aura_pdf` and `aura_docx` in
  `server/src/egomnia_agents/__init__.py` use restricted tool lists
  (`PDF_AGENT_TOOLS` / `DOCX_AGENT_TOOLS`) — no RAG tools on purpose
- Conversion to PDF is intentionally rejected by `convert_document`

### Dev Docker environment & schema migrations

- `docker-compose.dev.yml` (root) — unified dev stack: mysql + backend (hot
  reload) + frontend (`next dev`) + code-server (VS Code extension in
  Extension Development Host) + one-off `migrate` / `init_db` under profile
  `tools`. Separate from the legacy prod compose files under `server/` and
  `frontend/`, which are NOT touched.
- `.env.dev.example` / `.env.dev` (gitignored) — per-dev local env.
- `server/Dockerfile.dev` + `server/scripts/dev_server.py` — hot-reload
  backend. `dev_server.py` sanitizes `sys.argv` before importing
  `config/__init__.py` (which still parses argparse at import time) and then
  calls `uvicorn.run("main:app", reload=True, reload_dirs=["/app/src"])`.
  Host port 8001 -> container 8000. `AURA_HOST`/`AURA_PORT` still drive
  binding via `BaseConfig`.
- `frontend/Dockerfile.dev` — `next dev` on 3000. `NEXT_PUBLIC_API_BASE_URL`
  is set at runtime (`http://localhost:8001/api`) because the browser runs on
  the host, not inside the compose network.
- `vscode_extension/Dockerfile.dev` + `entrypoint.dev.sh` — code-server
  (`codercom/code-server`) + Node 20, starts `npm run watch` and exposes VS
  Code in the browser on :8443 with the extension loaded via
  `--extensionDevelopmentPath`. `egomnia-aura.serverUrl` is seeded to
  `http://backend:8000` (compose-internal network, not `localhost`).
- `server/alembic.ini` + `server/migrations/env.py` — Alembic schema
  migrations. `env.py` imports `db.base.Base` + `db.models` to populate
  `target_metadata`, reads `DATABASE_URL` at runtime, supports online/offline.
- Dev scripts are split by OS:
  - `scripts/macos/*.sh` (bash): `dev-up`, `dev-down`, `dev-migrate`
    (baseline/upgrade/downgrade/revision/history/current), `dev-logs`,
    plus the legacy `start.sh` (host-mode launcher) and
    `start-extension.sh` (desktop VS Code extension dev host).
  - `scripts/windows/*.ps1` (PowerShell): one-to-one equivalent of each
    macOS script with identical semantics and arguments.
  - Documentation (AURA.md, migrations README) uses the macOS form by
    default and notes Windows substitution at the top of each section.
- `publish-vscode.sh` has been removed (obsolete).
- The MySQL seed dump (`server/dumps/aura_baseline.sql`) is produced by
  the maintainer via DataGrip export and shared out-of-band with teammates;
  it is gitignored and loaded by the mysql container from
  `/docker-entrypoint-initdb.d` on first boot of the data volume.
- `scripts/sync_db.py` is now deprecated in favor of Alembic; keep in place
  until no environment depends on it.
- **Operational cookbook**: the full per-scenario guide (how to modify a
  model end-to-end, how to review an autogenerated file, first-time setup
  vs. new-teammate setup, common scenarios, troubleshooting, hard rules)
  is documented in two places:
  1. `server/migrations/README.md` — the authoritative reference
  2. `AURA.md` §15.5–15.9 — in-line version, written so coding agents
     acting on the repo can follow the flow autonomously without opening
     external docs
  When Aura itself plans a DB schema change, it MUST follow §15.5 step by
  step (modify model → generate migration → review → upgrade → commit
  both files together) and MUST NOT edit the MySQL schema directly.

## Use this map when

- Aura plans instead of acting
- a skill is not selected or is selected incorrectly
- the first-turn context feels wrong
- the response shape is correct but the behavior is wrong
- job events or completion behavior look inconsistent
- a contributor needs to spin up the project locally or asks about
  migrations, Alembic, the dev compose, code-server, or the `dev-*.sh`
  scripts
