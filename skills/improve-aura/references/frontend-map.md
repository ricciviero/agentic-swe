# Frontend Map

## Main files

- `vscode_extension/src/chatViewProvider.ts`
  Webview HTML, CSS, JS, chat state, chips, dropdowns, send/stop, thinking UI
- `vscode_extension/src/websocketManager.ts`
  WebSocket connection, driver exec handling, skill scan/sync, job events
- `vscode_extension/src/httpClient.ts`
  HTTP request payloads and response types
- `vscode_extension/src/extension.ts`
  Extension activation and provider wiring

## Use this map when

- the UI shows the wrong skill
- the dropdown, chip, or auto-selection is inconsistent
- the thinking state duplicates itself or feels confusing
- send/stop behavior is wrong
- job events reach the extension but the UI does not reflect them

## Typical frontend change patterns

- Visual/state-only issue:
  start from `chatViewProvider.ts`
- Message payload mismatch:
  inspect `httpClient.ts` and corresponding server payload handling
- Live sync mismatch:
  inspect `websocketManager.ts` and `chatViewProvider.ts` together
