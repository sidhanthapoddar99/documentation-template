// Shared types, identity generation, and utilities for the editor UI

export type SaveStatus = 'saved' | 'unsaved' | 'saving';

export interface Identity {
  userId: string;
  name: string;
  color: string;
}

export interface EditorDom {
  overlay: HTMLDivElement;
  textarea: HTMLTextAreaElement;
  highlightPre: HTMLPreElement;
  cursorsDiv: HTMLDivElement;
  preview: HTMLDivElement;
  statusEl: HTMLSpanElement;
  refreshBtn: HTMLButtonElement;
  saveBtn: HTMLButtonElement;
  closeBtn: HTMLButtonElement;
  resizeHandle: HTMLDivElement;
  leftPane: HTMLDivElement;
  rightPane: HTMLDivElement;
}

export interface EditorContext {
  dom: EditorDom;
  filePath: string;
  identity: Identity;
  getSaveStatus: () => SaveStatus;
  setSaveStatus: (s: SaveStatus) => void;
  getYjsSynced: () => boolean;
  setYjsSynced: (v: boolean) => void;
  getIsApplyingRemote: () => boolean;
  setIsApplyingRemote: (v: boolean) => void;
}

export interface Disposable {
  cleanup: () => void;
}

// ---- Identity generation ----

const ADJECTIVES = [
  'Swift', 'Bright', 'Calm', 'Deft', 'Keen',
  'Bold', 'Warm', 'Quick', 'Wise', 'Neat',
];

const ANIMALS = [
  'Otter', 'Falcon', 'Panda', 'Lynx', 'Heron',
  'Fox', 'Owl', 'Crane', 'Wolf', 'Finch',
];

const COLORS = [
  '#f7768e', '#ff9e64', '#e0af68', '#9ece6a', '#73daca',
  '#7aa2f7', '#bb9af7', '#2ac3de', '#7dcfff', '#c0caf5',
];

export function getOrCreateIdentity(): Identity {
  const stored = sessionStorage.getItem('__editor_identity');
  if (stored) {
    try { return JSON.parse(stored); } catch { /* regenerate */ }
  }

  const userId = crypto.randomUUID();
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const name = `${adj} ${animal}`;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  const identity = { userId, name, color };
  sessionStorage.setItem('__editor_identity', JSON.stringify(identity));
  return identity;
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
