## Goal

Right now the editor is bound to the dev server lifecycle. Once it becomes a real long-running server (used in multiple ways beyond static rendering), it needs the usual operational surface.

## Tasks

- [ ] Process manager for the editor server (PM2 or similar)
- [ ] Auto-restart on crash
- [ ] Graceful shutdown handling — close WebSocket connections, save state
- [ ] Health-check endpoint for monitoring
