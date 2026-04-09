/**
 * CodeMirror 6 setup — extensions, theme, keybindings
 *
 * Creates a configured EditorView with:
 * - Markdown language support (with nested code highlighting)
 * - Tokyo Night-inspired dark theme
 * - Line wrapping, line numbers optional
 * - Save keybinding (Ctrl/Cmd+S)
 * - Escape to close
 * - Bracket/quote auto-close for markdown
 */

import { EditorState, type Extension, Compartment } from '@codemirror/state';
import { EditorView, keymap, drawSelection, highlightActiveLine, highlightSpecialChars } from '@codemirror/view';
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput } from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion } from '@codemirror/autocomplete';
import { search, searchKeymap } from '@codemirror/search';

// Compartment for toggling readOnly state
export const readOnlyCompartment = new Compartment();
// Compartment for swapping language
export const languageCompartment = new Compartment();

// Tokyo Night-inspired theme to match the existing editor aesthetic
const tokyoNightTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--color-bg-secondary, #1a1b26)',
    color: 'var(--color-text-primary, #c0caf5)',
    fontSize: '13px',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: 'var(--font-family-mono, "JetBrains Mono", "Fira Code", monospace)',
    lineHeight: '1.7',
    padding: '16px',
    caretColor: 'var(--color-text-primary, #c0caf5)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--color-text-primary, #c0caf5)',
    borderLeftWidth: '2px',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(99, 102, 241, 0.3) !important',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--color-bg-secondary, #1a1b26)',
    color: 'var(--color-text-muted, #565f89)',
    borderRight: '1px solid var(--color-border-default, #292e42)',
    minWidth: '40px',
  },
  '.cm-scroller': {
    overflow: 'auto',
    height: '100%',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--color-bg-secondary, #1a1b26)',
    border: '1px solid var(--color-border-default, #292e42)',
    color: 'var(--color-text-primary, #c0caf5)',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  // Yjs remote cursor styling
  '.cm-ySelectionInfo': {
    fontSize: '11px',
    fontFamily: 'system-ui, sans-serif',
    padding: '1px 4px',
    borderRadius: '3px',
    opacity: '0.9',
  },
}, { dark: true });

export interface EditorSetupOptions {
  onSave: () => void;
  onClose: () => void;
  parent: HTMLElement;
  initialDoc?: string;
  readOnly?: boolean;
  extensions?: Extension[];
}

export function createEditorView(opts: EditorSetupOptions): EditorView {
  const extensions: Extension[] = [
    // Core
    highlightSpecialChars(),
    history(),
    drawSelection(),
    indentOnInput(),
    bracketMatching(),
    highlightActiveLine(),

    // Language (markdown by default, swappable via compartment)
    languageCompartment.of(
      markdown({ base: markdownLanguage })
    ),

    // Theme
    tokyoNightTheme,
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),

    // Line wrapping
    EditorView.lineWrapping,

    // Autocomplete (for slash commands)
    autocompletion({
      override: [], // Populated by slash-commands.ts
    }),

    // Search
    search(),

    // Keybindings
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      indentWithTab,
      {
        key: 'Mod-s',
        run: () => { opts.onSave(); return true; },
      },
      {
        key: 'Escape',
        run: () => { opts.onClose(); return true; },
      },
    ]),

    // ReadOnly compartment (toggled when Yjs syncs)
    readOnlyCompartment.of(EditorState.readOnly.of(opts.readOnly ?? true)),

    // Additional extensions (Yjs binding, slash commands, etc.)
    ...(opts.extensions ?? []),
  ];

  const view = new EditorView({
    state: EditorState.create({
      doc: opts.initialDoc ?? '',
      extensions,
    }),
    parent: opts.parent,
  });

  return view;
}
