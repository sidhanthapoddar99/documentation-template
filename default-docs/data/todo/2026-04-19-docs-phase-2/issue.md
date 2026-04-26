## Goal

Bring **user-guide** and **dev-docs** back in sync with the code. Phase 2 landed a lot of moving pieces (new content type, new dev-tools subsystem, new sync layer, new theme contract) and most of the existing pages were written against the phase-1 shape. Before we start phase-3 work (search, plugins), docs need to reflect what the code actually does today.

## Scope — what changed in phase 2 that needs documenting

**New / renamed subsystems**

- `src/dev-toolbar/` → `src/dev-tools/` rename, folder-per-tool layout (`server/`, `editor/`, `layout-selector/`, `error-logger/`, `system-metrics/`, `cache-inspector/`, `_shared/`).
- Editor V2 on Yjs CRDT — two-channel sync (WebSocket for text, SSE for presence/render), `yjs-sync.ts`, `editor-store.ts`, `presence.ts`.
- System metrics + cache inspector toolbar apps (live under Astro's 3-dot overflow).
- Shared CSS primitives in `_shared/styles.ts` consumed by all non-editor dev-tools apps.

**New content type**

- **Issues** (folder-per-item, `YYYY-MM-DD-<slug>/`, `settings.json` vocabulary, subtasks/notes/agent-log, sub-doc URLs, filter views). Zero user-facing doc coverage today.

**Theme / layout contract changes**

- Two-tier token model (`--ui-text-*`, `--content-*`, `--display-*`) replacing direct use of primitive `--font-size-*` in layouts. Layouts MUST consume the declared contract — no invented names, no hardcoded fallbacks.
- Required variables contract in `src/styles/theme.yaml`.

**Config surface**

- `editor.presence.*` timing knobs in `site.yaml`.
- `theme:` / `theme_paths:` resolution (built-in vs user themes).

## Non-goals (for this issue)

- Phase-3 features (search, plugin system) — those get their own docs when they land.
- Auto-generating API reference from source — out of scope for phase 2.
- Translating docs — English only.

## Approach

Work section-by-section rather than file-by-file. Each subtask owns one audit target (e.g. "dev-docs/20_development/live-editor", "user-guide/25_layouts/issues") and covers: read the existing page → diff against current code → rewrite or add.

See subtasks for the workstreams.

## Quick subtasks (braindump — expand later)

Rough work items that are top-of-mind. Each will be promoted into a proper subtask file once scope is firm.

**Theme system**

- Theme config page — update to reflect the new two-tier token model (primitive + semantic UI / content / display tiers).
- Dev-docs theme standardization — document the sizing + colour standardization work: required-variables contract in `theme.yaml`, no invented names, no hardcoded fallbacks in layouts.

**Config audit**

- Sweep `site.yaml`, `navbar.yaml`, `footer.yaml`, `settings.json` surfaces for anything that changed in phase 2 and isn't reflected in the user-guide config section (e.g. `editor.presence.*`, `theme_paths`, any new aliases).

**Dev tools**

- Cover the two new toolbar apps: `system-metrics` (RAM/CPU) and `cache-inspector` (Yjs rooms, editor docs, presence).
- Document the new `src/dev-tools/` folder-per-tool structure and the `_shared/` common CSS / (future) formatters layer.
- Live editor gets split out as its own module — do NOT rewrite the live-editor doc in this issue, it's substantial enough to stand alone.

**Layouts**

- Document the new issues layout (purpose, folder-per-item data model, sub-doc URLs, vocabulary-driven filters).
- Document the layout system generally — how `src/layouts/<type>/<style>/` resolution works, how a new style plugs in.

**User-guide restructure** (reader-facing reshape of the IA)

- Move layout topics out of "Writing Content" into top-level sections. New top-level shape:
  - **Writing Content** — markdown conventions, frontmatter, custom tags. No layout mechanics here.
  - **Layout System** — simple overview: what a layout is, its config/settings, the four types, structure at a glance.
  - **Docs** — authoring docs layouts.
  - **Blogs** — authoring blog layouts.
  - **Issues** — purpose, folder-per-item model, why it's AI-native.
  - **Custom** — custom layouts.
- Remove code / project-structure explanations from the user guide. Users shouldn't need to know backend or frontend internals to write docs. Move that material into dev-docs.
- Claude skills section stays; emphasis on how to write docs and use them without touching backend/frontend is the right framing.

**Dev-docs restructure**

- Not concerned with *how to write* docs (that's user-guide's job). Concerned with basic rules-of-the-road: folder structure, how data is parsed, config settings, internal doc structure.
- Define the main code-base components up front for orientation:
  - Overall architecture
  - Parsers
  - Routing system
  - Layout system
  - Caching system
  - Scripts
  - Dev toolkits
  - Optimizations
  - Theme system
- Explicitly not covered: Claude skills.
