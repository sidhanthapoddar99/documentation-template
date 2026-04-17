---
iteration: 1
agent: claude-opus-4-7
date: 2026-04-17
status: in-progress
---

# What I tried

Profiled a 400KB doc. Main thread time dominated by the markdown re-render
pipeline running on every keystroke. Debounce is 150ms but the render itself
takes 220ms average on a mid-range laptop, so keystrokes queue up behind it.

# What I learned

- The parser rebuilds the full AST each pass — no incremental mode.
- The outline component re-renders all heading nodes even when only one line changed.
- y-codemirror.next isn't the culprit; Yjs updates apply in under 1ms.

# Next iteration

Try incremental parsing via `unified`'s streaming mode, or switch to a
range-aware re-render that only touches the changed region.
