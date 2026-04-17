---
title: "Reduce typing latency on large files below 16ms"
done: false
---

## Goal

Every keystroke must feel instant. The ceiling is 16ms (one 60Hz frame) — if
we blow past that, the cursor lags and people start to hate the app.

## Current numbers

From `agent-log/001_initial-triage.md`:

- Small docs (< 50KB): p95 typing latency ~4ms ✅
- Mid docs (50–250KB): p95 ~28ms ⚠️
- Large docs (> 250KB): p95 ~220ms 🔥

The fix in `agent-log/002_incremental-parse-spike.md` got the 400KB case down
to ~14ms p95 — but only in a spike branch. Need to productize it.

## Tasks

1. Land the range-delta parser behind a feature flag
2. Handle fenced code blocks that span multiple paragraphs (the spike missed this)
3. Make sure `y-codemirror.next` sync still works — the spike bypassed the
   normal Yjs observe path
4. Regression test: 400KB doc, type 100 characters, measure p95 latency

## Risks

- Incremental parsing is state-heavy; bugs show up as stale decorations or
  missing syntax highlight. Need aggressive invalidation for edge cases
  (table edits, list nesting changes).
- If we ship this and it breaks Yjs collab, that's a much bigger problem than
  slow typing. Feature flag first, measure in prod for a week.

## Acceptance

- p95 typing latency < 16ms on docs up to 500KB
- No new bugs in the markdown fixture test suite
- Yjs collab tested with two clients on a 400KB doc
