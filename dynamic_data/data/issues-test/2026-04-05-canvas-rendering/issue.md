## Context

CM6 + HTML rendering is fast enough for typical docs, but for very long documents (10k+ lines) the DOM cost of many inline decorations adds up. Canvas rendering would sidestep this entirely.

## Blocked on

Needs a spike to estimate: accessibility story, text selection UX, and code-syntax colouring budget. Parked until after WYSIWYG lands.
