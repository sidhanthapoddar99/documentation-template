/**
 * Editor V2 — Pure black/white themes for CodeMirror 6
 *
 * Dark: #0a0a0a background, no blue/purple tint
 * Light: #ffffff background, no warm/cool tint
 * Syntax colors: muted, functional, not decorative
 */

import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import type { Extension } from '@codemirror/state';

// ---- Dark Theme ----

const darkColors = {
  bg:           '#0a0a0a',
  surface:      '#111111',
  border:       '#222222',
  text:         '#e0e0e0',
  textMuted:    '#666666',
  cursor:       '#ffffff',
  selection:    'rgba(255, 255, 255, 0.08)',
  activeLine:   'rgba(255, 255, 255, 0.03)',
  scrollThumb:  '#333333',
  matchBracket: 'rgba(255, 255, 255, 0.12)',
};

const darkEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: darkColors.bg,
    color: darkColors.text,
    fontSize: '14px',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace',
    lineHeight: '1.6',
    padding: '20px 8px',
    caretColor: darkColors.cursor,
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: darkColors.cursor,
    borderLeftWidth: '2px',
  },
  '.cm-activeLine': {
    backgroundColor: darkColors.activeLine,
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: `${darkColors.selection} !important`,
  },
  '.cm-gutters': {
    backgroundColor: darkColors.surface,
    color: darkColors.textMuted,
    borderRight: `1px solid ${darkColors.border}`,
    minWidth: '48px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: darkColors.activeLine,
    color: darkColors.text,
  },
  '.cm-scroller': {
    overflow: 'auto',
    height: '100%',
  },
  '.cm-matchingBracket': {
    backgroundColor: darkColors.matchBracket,
    outline: 'none',
  },
  '.cm-tooltip': {
    backgroundColor: darkColors.surface,
    border: `1px solid ${darkColors.border}`,
    color: darkColors.text,
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  '.cm-panels': {
    backgroundColor: darkColors.surface,
    color: darkColors.text,
    borderBottom: `1px solid ${darkColors.border}`,
  },
  '.cm-panel input': {
    backgroundColor: darkColors.bg,
    color: darkColors.text,
    border: `1px solid ${darkColors.border}`,
    borderRadius: '3px',
    padding: '2px 6px',
  },
  '.cm-panel button': {
    backgroundColor: darkColors.surface,
    color: darkColors.text,
    border: `1px solid ${darkColors.border}`,
    borderRadius: '3px',
  },
  '.cm-searchMatch': {
    backgroundColor: 'rgba(255, 200, 0, 0.15)',
    outline: '1px solid rgba(255, 200, 0, 0.3)',
  },
  '.cm-searchMatch-selected': {
    backgroundColor: 'rgba(255, 200, 0, 0.3)',
  },
  // Yjs remote cursors
  '.cm-ySelectionInfo': {
    fontSize: '11px',
    fontFamily: 'system-ui, sans-serif',
    padding: '1px 4px',
    borderRadius: '3px',
    opacity: '0.85',
  },
  // Custom scrollbar
  '.cm-scroller::-webkit-scrollbar': {
    width: '6px',
    height: '6px',
  },
  '.cm-scroller::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '.cm-scroller::-webkit-scrollbar-thumb': {
    background: darkColors.scrollThumb,
    borderRadius: '3px',
  },
  '.cm-scroller::-webkit-scrollbar-thumb:hover': {
    background: '#444444',
  },
}, { dark: true });

const darkSyntax = HighlightStyle.define([
  { tag: tags.comment, color: '#555555', fontStyle: 'italic' },
  { tag: tags.lineComment, color: '#555555', fontStyle: 'italic' },
  { tag: tags.blockComment, color: '#555555', fontStyle: 'italic' },
  { tag: tags.string, color: '#a8cc8c' },
  { tag: tags.special(tags.string), color: '#a8cc8c' },
  { tag: tags.keyword, color: '#d4bfff' },
  { tag: tags.controlKeyword, color: '#d4bfff' },
  { tag: tags.operatorKeyword, color: '#d4bfff' },
  { tag: tags.function(tags.variableName), color: '#e0e0e0' },
  { tag: tags.definition(tags.variableName), color: '#e0e0e0' },
  { tag: tags.variableName, color: '#e0e0e0' },
  { tag: tags.number, color: '#f0c674' },
  { tag: tags.bool, color: '#f0c674' },
  { tag: tags.operator, color: '#888888' },
  { tag: tags.separator, color: '#888888' },
  { tag: tags.punctuation, color: '#888888' },
  { tag: tags.bracket, color: '#888888' },
  { tag: tags.meta, color: '#555555' },
  { tag: tags.link, color: '#7aa2f7', textDecoration: 'underline' },
  { tag: tags.url, color: '#7aa2f7' },
  { tag: tags.heading, color: '#e0e0e0', fontWeight: 'bold' },
  { tag: tags.heading1, color: '#e0e0e0', fontWeight: 'bold', fontSize: '1.3em' },
  { tag: tags.heading2, color: '#e0e0e0', fontWeight: 'bold', fontSize: '1.15em' },
  { tag: tags.heading3, color: '#e0e0e0', fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#d4bfff' },
  { tag: tags.strong, fontWeight: 'bold', color: '#e0e0e0' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#666666' },
  { tag: tags.monospace, color: '#a8cc8c' },
  { tag: tags.processingInstruction, color: '#555555' }, // frontmatter ---
  { tag: tags.typeName, color: '#d4bfff' },
  { tag: tags.className, color: '#e0e0e0' },
  { tag: tags.propertyName, color: '#e0e0e0' },
  { tag: tags.labelName, color: '#e0e0e0' },
  { tag: tags.atom, color: '#f0c674' },
  { tag: tags.null, color: '#f0c674' },
  { tag: tags.regexp, color: '#a8cc8c' },
  { tag: tags.escape, color: '#f0c674' },
  { tag: tags.tagName, color: '#d4bfff' },
  { tag: tags.attributeName, color: '#a8cc8c' },
  { tag: tags.attributeValue, color: '#a8cc8c' },
]);

// ---- Light Theme ----

const lightColors = {
  bg:           '#ffffff',
  surface:      '#fafafa',
  border:       '#e5e5e5',
  text:         '#1a1a1a',
  textMuted:    '#999999',
  cursor:       '#000000',
  selection:    'rgba(0, 0, 0, 0.06)',
  activeLine:   'rgba(0, 0, 0, 0.02)',
  scrollThumb:  '#cccccc',
  matchBracket: 'rgba(0, 0, 0, 0.08)',
};

const lightEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: lightColors.bg,
    color: lightColors.text,
    fontSize: '14px',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace',
    lineHeight: '1.6',
    padding: '20px 8px',
    caretColor: lightColors.cursor,
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: lightColors.cursor,
    borderLeftWidth: '2px',
  },
  '.cm-activeLine': {
    backgroundColor: lightColors.activeLine,
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: `${lightColors.selection} !important`,
  },
  '.cm-gutters': {
    backgroundColor: lightColors.surface,
    color: lightColors.textMuted,
    borderRight: `1px solid ${lightColors.border}`,
    minWidth: '48px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: lightColors.activeLine,
    color: lightColors.text,
  },
  '.cm-scroller': {
    overflow: 'auto',
    height: '100%',
  },
  '.cm-matchingBracket': {
    backgroundColor: lightColors.matchBracket,
    outline: 'none',
  },
  '.cm-tooltip': {
    backgroundColor: lightColors.bg,
    border: `1px solid ${lightColors.border}`,
    color: lightColors.text,
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  '.cm-panels': {
    backgroundColor: lightColors.surface,
    color: lightColors.text,
    borderBottom: `1px solid ${lightColors.border}`,
  },
  '.cm-panel input': {
    backgroundColor: lightColors.bg,
    color: lightColors.text,
    border: `1px solid ${lightColors.border}`,
    borderRadius: '3px',
    padding: '2px 6px',
  },
  '.cm-panel button': {
    backgroundColor: lightColors.surface,
    color: lightColors.text,
    border: `1px solid ${lightColors.border}`,
    borderRadius: '3px',
  },
  '.cm-searchMatch': {
    backgroundColor: 'rgba(255, 200, 0, 0.2)',
    outline: '1px solid rgba(255, 200, 0, 0.4)',
  },
  '.cm-searchMatch-selected': {
    backgroundColor: 'rgba(255, 200, 0, 0.4)',
  },
  '.cm-ySelectionInfo': {
    fontSize: '11px',
    fontFamily: 'system-ui, sans-serif',
    padding: '1px 4px',
    borderRadius: '3px',
    opacity: '0.85',
  },
  '.cm-scroller::-webkit-scrollbar': {
    width: '6px',
    height: '6px',
  },
  '.cm-scroller::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '.cm-scroller::-webkit-scrollbar-thumb': {
    background: lightColors.scrollThumb,
    borderRadius: '3px',
  },
  '.cm-scroller::-webkit-scrollbar-thumb:hover': {
    background: '#aaaaaa',
  },
}, { dark: false });

const lightSyntax = HighlightStyle.define([
  { tag: tags.comment, color: '#999999', fontStyle: 'italic' },
  { tag: tags.lineComment, color: '#999999', fontStyle: 'italic' },
  { tag: tags.blockComment, color: '#999999', fontStyle: 'italic' },
  { tag: tags.string, color: '#2e7d32' },
  { tag: tags.special(tags.string), color: '#2e7d32' },
  { tag: tags.keyword, color: '#7b1fa2' },
  { tag: tags.controlKeyword, color: '#7b1fa2' },
  { tag: tags.operatorKeyword, color: '#7b1fa2' },
  { tag: tags.function(tags.variableName), color: '#1a1a1a' },
  { tag: tags.definition(tags.variableName), color: '#1a1a1a' },
  { tag: tags.variableName, color: '#1a1a1a' },
  { tag: tags.number, color: '#e65100' },
  { tag: tags.bool, color: '#e65100' },
  { tag: tags.operator, color: '#666666' },
  { tag: tags.separator, color: '#666666' },
  { tag: tags.punctuation, color: '#666666' },
  { tag: tags.bracket, color: '#666666' },
  { tag: tags.meta, color: '#999999' },
  { tag: tags.link, color: '#1565c0', textDecoration: 'underline' },
  { tag: tags.url, color: '#1565c0' },
  { tag: tags.heading, color: '#1a1a1a', fontWeight: 'bold' },
  { tag: tags.heading1, color: '#1a1a1a', fontWeight: 'bold', fontSize: '1.3em' },
  { tag: tags.heading2, color: '#1a1a1a', fontWeight: 'bold', fontSize: '1.15em' },
  { tag: tags.heading3, color: '#1a1a1a', fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#7b1fa2' },
  { tag: tags.strong, fontWeight: 'bold', color: '#1a1a1a' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#999999' },
  { tag: tags.monospace, color: '#2e7d32' },
  { tag: tags.processingInstruction, color: '#999999' },
  { tag: tags.typeName, color: '#7b1fa2' },
  { tag: tags.className, color: '#1a1a1a' },
  { tag: tags.propertyName, color: '#1a1a1a' },
  { tag: tags.labelName, color: '#1a1a1a' },
  { tag: tags.atom, color: '#e65100' },
  { tag: tags.null, color: '#e65100' },
  { tag: tags.regexp, color: '#2e7d32' },
  { tag: tags.escape, color: '#e65100' },
  { tag: tags.tagName, color: '#7b1fa2' },
  { tag: tags.attributeName, color: '#2e7d32' },
  { tag: tags.attributeValue, color: '#2e7d32' },
]);

// ---- Exports ----

export function darkTheme(): Extension[] {
  return [darkEditorTheme, syntaxHighlighting(darkSyntax)];
}

export function lightTheme(): Extension[] {
  return [lightEditorTheme, syntaxHighlighting(lightSyntax)];
}

export { darkColors, lightColors };
