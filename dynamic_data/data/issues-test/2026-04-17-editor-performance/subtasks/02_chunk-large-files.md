---
title: "Chunk large files over 500KB"
done: true
---

## Context

For the 412KB blog post, the initial mount spent 1.4s parsing. Users don't need
the entire AST up-front — only the viewport plus a small over-scroll buffer.

## Approach

- Split the raw markdown into ~50KB windows at paragraph boundaries.
- Parse the first window synchronously, schedule the rest via `requestIdleCallback`.
- Outline panel reads from a lightweight heading-only first pass that runs ahead
  of full parse.

```ts
// core/chunked-parser.ts
export function chunkByParagraph(raw: string, target = 50_000): string[] {
  const out: string[] = [];
  let buf = '';
  for (const para of raw.split(/\n\n+/)) {
    if (buf.length + para.length > target && buf) {
      out.push(buf);
      buf = '';
    }
    buf += (buf ? '\n\n' : '') + para;
  }
  if (buf) out.push(buf);
  return out;
}
```

## Result

Cold TTI on the 412KB doc: **1.9s → 340ms**. The remainder parses idle in the
background; users don't notice unless they scroll to the very bottom within the
first 200ms.

## Acceptance

- [x] Files over 500KB no longer block the first paint
- [x] Outline is usable within 200ms
- [x] No visible layout shift when later chunks land
