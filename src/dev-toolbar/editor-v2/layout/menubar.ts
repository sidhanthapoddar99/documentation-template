/**
 * Menu bar — File, Edit, View dropdown menus
 *
 * Renders a minimal menu bar with dropdown menus.
 * View menu contains the view mode switcher (Source/Split/Preview/WYSIWYG).
 */

import { icon } from './icons.js';
import type { Disposable } from '../types.js';

export type ViewMode = 'source' | 'split' | 'preview' | 'wysiwyg';

export interface MenuBarHandle extends Disposable {
  getViewMode: () => ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export interface MenuBarCallbacks {
  onSave: () => void;
  onClose: () => void;
  onNewFile: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFind: () => void;
}

export function initMenuBar(
  container: HTMLElement,
  callbacks: MenuBarCallbacks,
): MenuBarHandle {
  let currentMode: ViewMode = (localStorage.getItem('ev2-view-mode') as ViewMode) || 'source';
  let openMenu: HTMLElement | null = null;

  container.innerHTML = `
    <div class="ev2-menubar">
      <div class="ev2-menu" data-menu="file">
        <button class="ev2-menu-trigger">File</button>
        <div class="ev2-menu-dropdown">
          <div class="ev2-menu-item" data-action="new-file">${icon('plus', 14)}<span>New File</span><span class="ev2-shortcut">Ctrl+N</span></div>
          <div class="ev2-menu-separator"></div>
          <div class="ev2-menu-item" data-action="save">${icon('save', 14)}<span>Save</span><span class="ev2-shortcut">Ctrl+S</span></div>
          <div class="ev2-menu-separator"></div>
          <div class="ev2-menu-item" data-action="close">${icon('x', 14)}<span>Close Editor</span></div>
        </div>
      </div>
      <div class="ev2-menu" data-menu="edit">
        <button class="ev2-menu-trigger">Edit</button>
        <div class="ev2-menu-dropdown">
          <div class="ev2-menu-item" data-action="undo">${icon('undo', 14)}<span>Undo</span><span class="ev2-shortcut">Ctrl+Z</span></div>
          <div class="ev2-menu-item" data-action="redo">${icon('redo', 14)}<span>Redo</span><span class="ev2-shortcut">Ctrl+Y</span></div>
          <div class="ev2-menu-separator"></div>
          <div class="ev2-menu-item" data-action="find">${icon('search', 14)}<span>Find</span><span class="ev2-shortcut">Ctrl+F</span></div>
        </div>
      </div>
      <div class="ev2-menu" data-menu="view">
        <button class="ev2-menu-trigger">View</button>
        <div class="ev2-menu-dropdown">
          <div class="ev2-menu-item" data-action="mode-source">${icon('code', 14)}<span>Source</span><span class="ev2-check" id="ev2-check-source"></span></div>
          <div class="ev2-menu-item" data-action="mode-split">${icon('panel-left', 14)}<span>Split</span><span class="ev2-check" id="ev2-check-split"></span></div>
          <div class="ev2-menu-item" data-action="mode-preview">${icon('eye', 14)}<span>Preview</span><span class="ev2-check" id="ev2-check-preview"></span></div>
          <div class="ev2-menu-item disabled" data-action="mode-wysiwyg">${icon('heading', 14)}<span>WYSIWYG</span><span class="ev2-shortcut">Soon</span></div>
          <div class="ev2-menu-separator"></div>
          <div class="ev2-menu-item" data-action="toggle-sidebar">${icon('panel-left', 14)}<span>Toggle Sidebar</span><span class="ev2-shortcut">Ctrl+B</span></div>
          <div class="ev2-menu-separator"></div>
          <div class="ev2-menu-item" data-action="toggle-theme">${icon('sun', 14)}<span>Toggle Theme</span></div>
        </div>
      </div>
    </div>
  `;

  function updateModeChecks() {
    const modes: ViewMode[] = ['source', 'split', 'preview'];
    for (const m of modes) {
      const el = container.querySelector(`#ev2-check-${m}`);
      if (el) el.textContent = currentMode === m ? '✓' : '';
    }
  }
  updateModeChecks();

  function closeAllMenus() {
    container.querySelectorAll('.ev2-menu.open').forEach(m => m.classList.remove('open'));
    openMenu = null;
  }

  // Menu trigger clicks
  container.addEventListener('click', (e) => {
    const trigger = (e.target as HTMLElement).closest('.ev2-menu-trigger') as HTMLElement;
    if (trigger) {
      e.stopPropagation();
      const menu = trigger.parentElement as HTMLElement;
      if (menu.classList.contains('open')) {
        closeAllMenus();
      } else {
        closeAllMenus();
        menu.classList.add('open');
        openMenu = menu;
      }
      return;
    }

    const item = (e.target as HTMLElement).closest('.ev2-menu-item:not(.disabled)') as HTMLElement;
    if (item) {
      const action = item.dataset.action;
      closeAllMenus();
      switch (action) {
        case 'save': callbacks.onSave(); break;
        case 'close': callbacks.onClose(); break;
        case 'new-file': callbacks.onNewFile(); break;
        case 'undo': callbacks.onUndo(); break;
        case 'redo': callbacks.onRedo(); break;
        case 'find': callbacks.onFind(); break;
        case 'toggle-sidebar': callbacks.onToggleSidebar(); break;
        case 'toggle-theme': callbacks.onToggleTheme(); break;
        case 'mode-source': setViewMode('source'); break;
        case 'mode-split': setViewMode('split'); break;
        case 'mode-preview': setViewMode('preview'); break;
        case 'mode-wysiwyg': setViewMode('wysiwyg'); break;
      }
    }
  });

  // Hover to switch between open menus
  container.addEventListener('mouseenter', (e) => {
    if (!openMenu) return;
    const trigger = (e.target as HTMLElement).closest('.ev2-menu') as HTMLElement;
    if (trigger && trigger !== openMenu) {
      closeAllMenus();
      trigger.classList.add('open');
      openMenu = trigger;
    }
  }, true);

  // Close on click outside
  function onDocClick() { closeAllMenus(); }
  document.addEventListener('click', onDocClick);

  function setViewMode(mode: ViewMode) {
    currentMode = mode;
    localStorage.setItem('ev2-view-mode', mode);
    updateModeChecks();
    callbacks.onViewModeChange(mode);
  }

  return {
    getViewMode: () => currentMode,
    setViewMode,
    cleanup() {
      document.removeEventListener('click', onDocClick);
    },
  };
}
