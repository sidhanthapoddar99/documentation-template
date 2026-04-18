## Goal

The editor surface is no longer dev-only — once it can run in production-ish setups, it needs a way to gate access without inventing a full user system.

## Authentication

- [ ] Simple password protection (single shared secret in `site.yaml` / env)
- [ ] Optional OAuth integration (GitHub, Google)

## Access-code invite system

- [ ] Generate single-use access codes for collaborators
- [ ] Code-entry form on editor load
- [ ] Code expiry / revocation
