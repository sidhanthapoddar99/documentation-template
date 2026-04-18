---
title: "Client-side markdown rendering"
done: false
---

Move markdown → HTML rendering from server to browser so preview is instant.

## Tasks

- [ ] Move markdown → HTML rendering from server to browser
- [ ] Bundle unified / remark / rehype for client (or use marked)
- [ ] Instant preview updates (no network round-trip, no render timer)
- [ ] Live Preview widgets use the same renderer for code blocks and tables
- [ ] Remove server-side `MSG_RENDER` / `MSG_RENDER_REQ` from Yjs protocol
- [ ] Server only handles file I/O, Yjs text sync, save/open/close
