---
title: "Subtask page header — title + status, not checkbox + slug"
done: false
---

Sidebar list rendering is fine — leave it as-is. The bug is on the **center / content page** for a subtask.

## Problem

When you open a subtask page, the top of the content currently renders the checkbox + the slug-ish identifier. That reads like a list item, not a page header.

## Fix

Replace with: **title (from frontmatter) + status badge** (done / not-done).

- Title comes from the subtask file's `title` frontmatter field
- Status badge mirrors the index style (small pill, vocabulary-coloured)
- Drop the inline checkbox from the page header — toggling already works from the sidebar and from the overview's combined view (subtask 09)

## Out of scope

- Sidebar list (already correct)
- Overview's per-subtask checkbox in the progress list
