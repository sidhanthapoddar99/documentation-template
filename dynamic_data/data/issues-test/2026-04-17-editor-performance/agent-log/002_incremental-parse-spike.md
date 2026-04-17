---
iteration: 2
agent: claude-opus-4-7
date: 2026-04-17
status: success
---

# What I tried

Replaced the full-doc re-parse with a range-delta approach — only the
paragraph containing the cursor gets re-parsed; the surrounding AST is reused.

# What I learned

- Typing latency on the 400KB doc dropped from ~220ms to ~14ms (p95).
- Outline still flickers because it redraws on every AST change. Separate problem.
- A couple of edge cases around fenced code blocks that span multiple paragraphs
  — the range needs to widen to the block boundary.

# Next iteration

Virtualize the outline so redraws only touch visible headings.
