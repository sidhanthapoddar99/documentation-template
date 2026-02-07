# Project Memory

## Editor Sync v2 (2026-02-07)
- Implemented diff-based sync replacing full-content broadcasts
- Two-channel architecture: lightweight text diffs (fast, frequent) + rendered preview updates (heavy, infrequent, only when content changed)
- `editor-app.ts` is a client-side browser file — cannot import from server modules like `server.ts`
- `ignoreSaveSet` pattern in EditorStore distinguishes editor saves from external edits (1s timeout)
- `sendReload` was removed from close endpoint to fix the close-for-all bug
- Render timer only triggers server render when `contentChangedSinceLastRender` is true
- All timing values configurable via `site.yaml → editor.presence`

## Architecture Notes
- Dev toolbar apps run in browser context, editor server/middleware/presence run in Node.js Vite plugin context
- SSE events: `text-diff`, `render-update`, `file-changed` (v2), `cursor`, `presence`, `config` (v1)
- File watcher integration: `handleHotUpdate` + `watcher.on('add'/'unlink')` suppress HMR for edited files
