---
author: claude
date: 2026-04-26
---

# Integration with the three usage methods (cross-reference)

Once the editor extraction lands (Rust core + server binary + Tauri desktop + web frontend per `notes/01_tauri-architecture.md`), it slots into each of the three usage methods defined in `2026-04-26-framework-as-cli-tool`. Recording the integration sketch here so this issue's future work knows where it plugs in.

## 1. CLI setup (Method 1 — compose-driven)

The editor server appears as another service in the user's `docs.yaml`:

```yaml
services:
  renderer:
    mode: dev
    port: 4321
  editor:
    enabled: true
    port: 5173
    auth: password           # auth from subtask 01 of this issue
```

`astro-doc compose` brings up both services in foreground (per the compose-as-source-of-truth design). `astro-doc compose editor` brings up just the editor for users who want to run the renderer separately. Schema reference: `2026-04-26-framework-as-cli-tool/subtasks/03_method-1-cli-tool.md`.

## 2. Repo setup (Method 2 — from-source)

The editor is a separate long-running process started alongside the renderer. Concretely: a shell script or thin CLI wrapper in the project root (sibling to today's `start` wrapper) brings up the editor service. Both processes share the same `.env` / `docs.yaml` — no duplicate config. Useful for contributors and framework hackers who want full control over both processes. Pattern reference: `2026-04-26-framework-as-cli-tool/subtasks/02_manual-from-source.md`.

## 3. Docker setup (Method 3 — containerised)

The editor ships as its own container — explicit Dockerfile + docker-compose service entry, run as a long-lived service (or full server for self-hosted multi-user installations). Auth gating from subtask 01 of this issue is enforced at the container's HTTP/WebSocket boundary. Topology, mount strategy, and skill-generated Dockerfile shape live in `2026-04-26-framework-as-cli-tool/notes/01_docker-deployment-design.md` — the editor service slots into the same compose patterns documented there.

## Related issues / references

- **`2026-04-26-framework-as-cli-tool`** — owns the three-method distribution architecture and the `docs.yaml` compose schema this issue's editor service plugs into
- `2026-04-26-framework-as-cli-tool/subtasks/01_root-alias.md` — `default-docs/` rename + template + init flow (the editor's config storage probably hooks into the same template structure)
- `2026-04-26-framework-as-cli-tool/subtasks/03_method-1-cli-tool.md` — `docs.yaml` schema this issue's editor service extends
- `2026-04-26-framework-as-cli-tool/notes/01_docker-deployment-design.md` — Docker topologies + skill-generated patterns
- `2026-04-26-project-rebrand` — naming for the editor product is downstream of the project rebrand
