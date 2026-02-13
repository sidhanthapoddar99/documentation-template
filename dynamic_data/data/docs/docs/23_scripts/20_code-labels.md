---
title: Code Labels
description: Language labels and copy-to-clipboard for code blocks
sidebar_position: 20
---

# Code Labels Script

**File:** `src/scripts/code-labels.ts`

Adds a language label to the top-right corner of syntax-highlighted code blocks. On hover the label changes to a copy button; clicking copies the code to the clipboard.

## How It Works

1. Finds all `<pre>` elements with a `data-language` attribute (added by the Shiki renderer in `marked.ts`)
2. Creates a `<span class="code-label">` with the language name
3. On hover: label text swaps to a copy icon + "Copy"
4. On click: copies the `<code>` text content to clipboard, shows "Copied!" for 1.5 seconds

## Behavior

| State | Label Shows |
|-------|-------------|
| Default | Language name (e.g., `typescript`) |
| Hover | Copy icon + "Copy" |
| After click | Check icon + "Copied!" (1.5s) |

## Requirements

Code blocks need the `data-language` attribute on the `<pre>` tag. The renderer adds this automatically:

```html
<pre data-language="typescript" class="shiki shiki-themes github-light github-dark">
  <code>...</code>
</pre>
```

Plain text code blocks (no language specified) don't get a label since `data-language` is set to `text`.
