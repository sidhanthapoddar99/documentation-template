---
title: Lightbox
description: Click-to-expand overlay for images and diagrams
sidebar_position: 15
---

# Lightbox Script

**File:** `src/scripts/lightbox.ts`

Adds click-to-expand functionality to images and rendered diagrams in markdown content. Clicking opens a full-screen overlay; close via the X button, clicking the background, or pressing Escape.

## What It Targets

| Element | Selector | Trigger |
|---------|----------|---------|
| Images | `.markdown-content img` | Bound immediately on load |
| Diagrams | `.markdown-content .diagram-rendered` | Bound after `diagrams:rendered` event |

## How It Works

1. Finds all images in `.markdown-content` and adds click handlers
2. Listens for the `diagrams:rendered` event to bind diagram click handlers (since diagrams render asynchronously)
3. On click, creates a full-screen overlay with the expanded image or cloned SVG
4. Uses a `WeakSet` to track already-bound elements and avoid duplicate handlers

## Overlay Structure

```html
<div class="lightbox-overlay lightbox-open">
  <button class="lightbox-close" aria-label="Close">&times;</button>
  <div class="lightbox-content">
    <!-- <img> for images, <svg> for diagrams -->
  </div>
</div>
```

## Closing

| Method | How |
|--------|-----|
| Close button | Click the X button |
| Background click | Click outside the content |
| Keyboard | Press `Escape` |
