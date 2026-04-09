---
title: "Content Duplication in Edit Mode"
description: Race condition causes document content to duplicate when editing long documents
sidebar_label: Duplicate Content Bug
---

# Content Duplication in Edit Mode

**Type:** Bug  
**Priority:** Critical  
**Component:** `src/dev-toolbar/editor-ui/yjs-client.ts`  
**Status:** Open

---

## Description

When editing a long document in the dev toolbar editor, content sometimes gets duplicated. The entire document appears twice in the editor textarea.

## Steps to Reproduce

1. Open a long document (100+ lines) in the dev toolbar editor
2. Start editing immediately without scrolling to the bottom
3. Content gets duplicated in the textarea

## Workaround

Scroll to the bottom of the textarea first, then scroll back up and begin editing. This prevents the duplication.

## Root Cause Analysis

The bug is a race condition between two content sources for the textarea:

### Race Window (`yjs-client.ts:287-303`)

1. HTTP `POST /open` response populates `textarea.value = data.raw` (line 289)
2. `connectYjsWs()` starts the WebSocket + Yjs sync (line 295)
3. Yjs sync completes, observe fires, sets `textarea.value = ytext.toString()`, marks `yjsSynced = true` (lines 245-247)
4. User types, `onInput` runs (line 302)

### Auto-save Timing Race

The `ignoreSaveSet` in `server.ts:281` has a 1-second timeout. If the file watcher fires after that window expires, it treats the editor's own save as an external edit, triggering `resetContent()`. This can corrupt the CRDT merge during active editing.

### Diff Algorithm Vulnerability

The prefix/suffix diff algorithm (`yjs-client.ts:312-330`) computes `insertStr = entire content` when `ytext.toString()` returns empty. This inserts the full document on top of existing content, causing duplication.

## Proposed Fix

1. **Make textarea readonly until Yjs sync completes** - prevents user input during the race window
2. **Add sanity check in `onInput`** - reject diffs where `insertStr` length approaches full document length with zero `deleteCount`
3. **Increase `ignoreSaveSet` timeout** or use a flag-based approach instead of timing-based

## Affected Files

- `src/dev-toolbar/editor-ui/yjs-client.ts` (lines 287-333)
- `src/dev-toolbar/editor/server.ts` (line 281, `ignoreSaveSet` timeout)
- `src/dev-toolbar/integration.ts` (lines 220-232, file watcher handler)
