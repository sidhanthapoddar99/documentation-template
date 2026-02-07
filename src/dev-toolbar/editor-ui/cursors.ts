// Remote cursor rendering — mirror div measurement + cursor data management

import type { EditorContext, Disposable } from './types.js';
import { escapeHtml } from './types.js';
import { setCursorUpdateCallback, sendPresenceAction, getServerCursorThrottle } from './sse-presence.js';

export interface CursorHandle extends Disposable {
  remeasureAllCursors: () => void;
  repositionAllRemoteCursors: () => void;
  syncMirrorWidth: () => void;
}

export function initRemoteCursors(ctx: EditorContext): CursorHandle {
  const { textarea, cursorsDiv, overlay } = ctx.dom;

  // Mirror div for accurate cursor measurement (handles word-wrap correctly)
  const cursorMirror = document.createElement('div');
  cursorMirror.setAttribute('aria-hidden', 'true');
  cursorMirror.style.cssText = `
    position: fixed; top: -9999px; left: -9999px;
    font-family: var(--font-family-mono, 'JetBrains Mono', 'Fira Code', monospace);
    font-size: 13px; line-height: 1.7; tab-size: 2;
    white-space: pre-wrap; word-wrap: break-word;
    padding: 16px; border: none; box-sizing: border-box;
    overflow-wrap: break-word;
  `;
  overlay.appendChild(cursorMirror);

  function syncMirrorWidth(): void {
    cursorMirror.style.width = `${textarea.clientWidth}px`;
  }
  syncMirrorWidth();

  // Measure pixel position of a character offset (handles word-wrap)
  function measureCursorCoords(offset: number): { top: number; left: number } {
    const text = textarea.value;
    const clamped = Math.min(offset, text.length);

    cursorMirror.textContent = '';
    cursorMirror.appendChild(document.createTextNode(text.substring(0, clamped)));
    const marker = document.createElement('span');
    marker.textContent = '\u200b';
    cursorMirror.appendChild(marker);
    cursorMirror.appendChild(document.createTextNode(text.substring(clamped) || ' '));

    const mRect = marker.getBoundingClientRect();
    const dRect = cursorMirror.getBoundingClientRect();
    return { top: mRect.top - dRect.top, left: mRect.left - dRect.left };
  }

  // Remote cursor data with cached absolute coordinates
  const remoteCursorData = new Map<string, {
    name: string; color: string; offset: number;
    absTop: number; absLeft: number;
  }>();
  const remoteCursorElements = new Map<string, HTMLDivElement>();

  function applyRemoteCursorPos(el: HTMLDivElement, absTop: number, absLeft: number): void {
    const top = absTop - textarea.scrollTop;
    const left = absLeft - textarea.scrollLeft;

    const rect = cursorsDiv.getBoundingClientRect();
    el.style.display = (top < -20 || top > rect.height || left < -10 || left > rect.width) ? 'none' : '';
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
  }

  function updateRemoteCursor(userId: string, name: string, color: string, cursor: { line: number; col: number; offset: number }): void {
    const coords = measureCursorCoords(cursor.offset);
    remoteCursorData.set(userId, {
      name, color, offset: cursor.offset,
      absTop: coords.top, absLeft: coords.left,
    });

    let el = remoteCursorElements.get(userId);
    if (!el) {
      el = document.createElement('div');
      el.className = 'remote-cursor';
      el.innerHTML = `<div class="remote-cursor-label">${escapeHtml(name)}</div><div class="remote-cursor-line"></div>`;
      cursorsDiv.appendChild(el);
      remoteCursorElements.set(userId, el);
    }

    el.style.setProperty('--cursor-color', color);
    applyRemoteCursorPos(el, coords.top, coords.left);
  }

  function repositionAllRemoteCursors(): void {
    for (const [userId, data] of remoteCursorData) {
      const el = remoteCursorElements.get(userId);
      if (el) applyRemoteCursorPos(el, data.absTop, data.absLeft);
    }
  }

  function remeasureAllCursors(): void {
    syncMirrorWidth();
    for (const [userId, data] of remoteCursorData) {
      const coords = measureCursorCoords(data.offset);
      data.absTop = coords.top;
      data.absLeft = coords.left;
      const el = remoteCursorElements.get(userId);
      if (el) applyRemoteCursorPos(el, coords.top, coords.left);
    }
  }

  // Register cursor update callback for SSE events
  setCursorUpdateCallback((data: any) => {
    if (data.userId === ctx.identity.userId) return;
    if (data.file !== ctx.filePath) return;
    updateRemoteCursor(data.userId, data.name, data.color, data.cursor);
  });

  // ---- Local cursor tracking ----
  let cursorThrottleTimer: ReturnType<typeof setTimeout> | null = null;
  let lastSentOffset = -1;

  function getLocalCursorPosition(): { line: number; col: number; offset: number } {
    const offset = textarea.selectionStart;
    const text = textarea.value.substring(0, offset);
    const lines = text.split('\n');
    const line = lines.length - 1;
    const col = lines[lines.length - 1].length;
    return { line, col, offset };
  }

  function sendLocalCursor(): void {
    if (cursorThrottleTimer) return;
    cursorThrottleTimer = setTimeout(() => {
      cursorThrottleTimer = null;
      const cursor = getLocalCursorPosition();
      if (cursor.offset === lastSentOffset) return;
      lastSentOffset = cursor.offset;
      sendPresenceAction({
        type: 'cursor',
        file: ctx.filePath,
        cursor,
      });
    }, getServerCursorThrottle());
  }

  function onCursorMove(): void {
    sendLocalCursor();
  }

  textarea.addEventListener('keyup', onCursorMove);
  textarea.addEventListener('mouseup', onCursorMove);
  textarea.addEventListener('click', onCursorMove);

  // Send initial cursor position when editor opens
  sendPresenceAction({
    type: 'cursor',
    file: ctx.filePath,
    cursor: { line: 0, col: 0, offset: 0 },
  });

  return {
    remeasureAllCursors,
    repositionAllRemoteCursors,
    syncMirrorWidth,
    cleanup() {
      if (cursorThrottleTimer) {
        clearTimeout(cursorThrottleTimer);
        cursorThrottleTimer = null;
      }
      textarea.removeEventListener('keyup', onCursorMove);
      textarea.removeEventListener('mouseup', onCursorMove);
      textarea.removeEventListener('click', onCursorMove);

      sendPresenceAction({ type: 'cursor-clear' });
      setCursorUpdateCallback(null);

      cursorMirror.remove();
      for (const el of remoteCursorElements.values()) el.remove();
      remoteCursorElements.clear();
      remoteCursorData.clear();
    },
  };
}
