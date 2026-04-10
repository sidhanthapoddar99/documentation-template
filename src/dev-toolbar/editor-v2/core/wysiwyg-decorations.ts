/**
 * WYSIWYG decorations — Obsidian-style "Live Preview" for CM6.
 *
 * - Walk the Lezer markdown tree for visible ranges
 * - Mark decorations for styling (bold, italic, headings)
 * - Replace decorations to hide syntax markers (**, *, #, etc.)
 * - Widget decorations for complex blocks (code blocks, tables, HR, frontmatter)
 * - Cursor inside a block → that block reverts to source mode
 */

import {
  Decoration,
  type DecorationSet,
  EditorView,
  WidgetType,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Compartment, type Extension, type Range, StateField, type Transaction } from '@codemirror/state';

export const wysiwygCompartment = new Compartment();


// ---- Widgets ----

class HRWidget extends WidgetType {
  toDOM() {
    const el = document.createElement('div');
    el.className = 'cm-wys-hr';
    return el;
  }
  eq() { return true; }
}

class CodeBlockWidget extends WidgetType {
  constructor(private code: string, private lang: string) { super(); }
  toDOM() {
    const wrap = document.createElement('div');
    wrap.className = 'cm-wys-code';
    if (this.lang) {
      const label = document.createElement('div');
      label.className = 'cm-wys-code-lang';
      label.textContent = this.lang;
      wrap.appendChild(label);
    }
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = this.code;
    pre.appendChild(code);
    wrap.appendChild(pre);
    return wrap;
  }
  eq(o: CodeBlockWidget) { return this.code === o.code && this.lang === o.lang; }
}

class TableWidget extends WidgetType {
  constructor(private rows: string[][]) { super(); }
  toDOM() {
    const table = document.createElement('table');
    table.className = 'cm-wys-table';
    for (let i = 0; i < this.rows.length; i++) {
      if (i === 1 && this.rows[i].every(c => /^[\s\-:|]+$/.test(c))) continue; // skip separator
      const tr = document.createElement('tr');
      for (const cell of this.rows[i]) {
        const el = document.createElement(i === 0 ? 'th' : 'td');
        el.textContent = cell.trim();
        tr.appendChild(el);
      }
      table.appendChild(tr);
    }
    return table;
  }
  eq(o: TableWidget) { return JSON.stringify(this.rows) === JSON.stringify(o.rows); }
}

class PropertiesWidget extends WidgetType {
  constructor(private props: [string, string][]) { super(); }
  toDOM() {
    const box = document.createElement('div');
    box.className = 'cm-wys-props';
    const hdr = document.createElement('div');
    hdr.className = 'cm-wys-props-hdr';
    hdr.textContent = 'Properties';
    box.appendChild(hdr);
    for (const [k, v] of this.props) {
      const row = document.createElement('div');
      row.className = 'cm-wys-props-row';
      const key = document.createElement('span');
      key.className = 'cm-wys-props-key';
      key.textContent = k;
      const val = document.createElement('span');
      val.className = 'cm-wys-props-val';
      val.textContent = v;
      row.appendChild(key);
      row.appendChild(val);
      box.appendChild(row);
    }
    return box;
  }
  eq(o: PropertiesWidget) { return JSON.stringify(this.props) === JSON.stringify(o.props); }
}

// ---- Frontmatter parser ----

function parseFrontmatter(doc: string): { end: number; props: [string, string][] } | null {
  if (!doc.startsWith('---\n') && !doc.startsWith('---\r\n')) return null;
  const close = doc.indexOf('\n---', 4);
  if (close === -1) return null;
  // end includes the closing --- and its newline
  let end = close + 4;
  if (end < doc.length && doc[end] === '\n') end++;

  const yaml = doc.slice(4, close);
  const props: [string, string][] = [];
  for (const line of yaml.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const ci = t.indexOf(':');
    if (ci > 0) {
      const k = t.slice(0, ci).trim();
      let v = t.slice(ci + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      props.push([k, v]);
    }
  }
  return props.length > 0 ? { end, props } : null;
}

// ---- Table text parser ----

function parseTableRows(text: string): string[][] {
  return text.split('\n').filter(l => l.trim()).map(line =>
    line.split('|').slice(1, -1) // trim leading/trailing empty from | col | col |
  );
}

// ---- Cursor helpers using EditorState ----

function cursorInRangeS(state: import('@codemirror/state').EditorState, from: number, to: number): boolean {
  for (const r of state.selection.ranges) {
    if (r.from <= to && r.to >= from) return true;
  }
  return false;
}

function cursorOnLineS(state: import('@codemirror/state').EditorState, from: number, to: number): boolean {
  const doc = state.doc;
  for (const r of state.selection.ranges) {
    const cl = doc.lineAt(r.head).number;
    const fl = doc.lineAt(from).number;
    const tl = doc.lineAt(Math.min(to, doc.length)).number;
    if (cl >= fl && cl <= tl) return true;
  }
  return false;
}

// ---- Build decorations from EditorState (StateField needs this) ----

function buildDecorationsFromState(state: import('@codemirror/state').EditorState): DecorationSet {
  const marks: Range<Decoration>[] = [];
  const replaces: Range<Decoration>[] = [];
  const doc = state.doc.toString();

  // ---- Frontmatter ----
  const fm = parseFrontmatter(doc);
  if (fm && fm.end <= doc.length) {
    if (!cursorInRangeS(state, 0, fm.end)) {
      replaces.push(Decoration.replace({ widget: new PropertiesWidget(fm.props), block: true }).range(0, fm.end));
    }
  }

  // ---- Walk syntax tree ----
  syntaxTree(state).iterate({
    enter(node) {
      const { from, to, name } = node;
      if (fm && from < fm.end) return;

      // ---- Headings ----
      if (name === 'ATXHeading1' || name === 'ATXHeading2' || name === 'ATXHeading3' ||
          name === 'ATXHeading4' || name === 'ATXHeading5' || name === 'ATXHeading6') {
        const level = name.charCodeAt(name.length - 1) - 48;
        marks.push(Decoration.line({ class: `cm-wys-h cm-wys-h${level}` }).range(state.doc.lineAt(from).from));

        if (!cursorOnLineS(state, from, to)) {
          const c = node.node.cursor();
          if (c.firstChild()) {
            do {
              if (c.name === 'HeaderMark') {
                const hideEnd = (state.sliceDoc(c.to, c.to + 1) === ' ') ? c.to + 1 : c.to;
                replaces.push(Decoration.replace({}).range(c.from, hideEnd));
              }
            } while (c.nextSibling());
          }
        }
        return false;
      }

      // ---- Bold ----
      if (name === 'StrongEmphasis') {
        marks.push(Decoration.mark({ class: 'cm-wys-bold' }).range(from, to));
        if (!cursorInRangeS(state, from, to)) {
          const c = node.node.cursor();
          if (c.firstChild()) { do { if (c.name === 'EmphasisMark') replaces.push(Decoration.replace({}).range(c.from, c.to)); } while (c.nextSibling()); }
        }
        return false;
      }

      // ---- Italic ----
      if (name === 'Emphasis') {
        marks.push(Decoration.mark({ class: 'cm-wys-italic' }).range(from, to));
        if (!cursorInRangeS(state, from, to)) {
          const c = node.node.cursor();
          if (c.firstChild()) { do { if (c.name === 'EmphasisMark') replaces.push(Decoration.replace({}).range(c.from, c.to)); } while (c.nextSibling()); }
        }
        return false;
      }

      // ---- Strikethrough ----
      if (name === 'Strikethrough') {
        marks.push(Decoration.mark({ class: 'cm-wys-strike' }).range(from, to));
        if (!cursorInRangeS(state, from, to)) {
          const c = node.node.cursor();
          if (c.firstChild()) { do { if (c.name === 'StrikethroughMark') replaces.push(Decoration.replace({}).range(c.from, c.to)); } while (c.nextSibling()); }
        }
        return false;
      }

      // ---- Inline code ----
      if (name === 'InlineCode') {
        marks.push(Decoration.mark({ class: 'cm-wys-inlinecode' }).range(from, to));
        if (!cursorInRangeS(state, from, to)) {
          const c = node.node.cursor();
          if (c.firstChild()) { do { if (c.name === 'CodeMark') replaces.push(Decoration.replace({}).range(c.from, c.to)); } while (c.nextSibling()); }
        }
        return false;
      }

      // ---- Fenced code block ----
      if (name === 'FencedCode') {
        if (!cursorInRangeS(state, from, to)) {
          const text = state.sliceDoc(from, to);
          const lines = text.split('\n');
          const lang = (lines[0] || '').replace(/^`{3,}\s*/, '').trim();
          const codeLines = lines.slice(1);
          if (codeLines.length && /^`{3,}/.test(codeLines[codeLines.length - 1].trim())) codeLines.pop();
          replaces.push(Decoration.replace({ widget: new CodeBlockWidget(codeLines.join('\n'), lang), block: true }).range(from, to));
        }
        return false;
      }

      // ---- Links ----
      if (name === 'Link') {
        marks.push(Decoration.mark({ class: 'cm-wys-link' }).range(from, to));
        if (!cursorInRangeS(state, from, to)) {
          const c = node.node.cursor();
          if (c.firstChild()) {
            do {
              if (c.name === 'LinkMark' || c.name === 'URL') {
                replaces.push(Decoration.replace({}).range(c.from, c.to));
              }
            } while (c.nextSibling());
          }
        }
        return false;
      }

      // ---- Images ----
      if (name === 'Image') {
        marks.push(Decoration.mark({ class: 'cm-wys-link' }).range(from, to));
        return false;
      }

      // ---- Blockquote ----
      if (name === 'Blockquote') {
        const startLine = state.doc.lineAt(from);
        const endLine = state.doc.lineAt(Math.min(to, state.doc.length));
        for (let ln = startLine.number; ln <= endLine.number; ln++) {
          marks.push(Decoration.line({ class: 'cm-wys-bq' }).range(state.doc.line(ln).from));
        }
        if (!cursorInRangeS(state, from, to)) {
          const c = node.node.cursor();
          if (c.firstChild()) {
            do {
              if (c.name === 'QuoteMark') {
                const hideEnd = (state.sliceDoc(c.to, c.to + 1) === ' ') ? c.to + 1 : c.to;
                replaces.push(Decoration.replace({}).range(c.from, hideEnd));
              }
            } while (c.nextSibling());
          }
        }
        return; // descend for inline formatting
      }

      // ---- Horizontal rule ----
      if (name === 'HorizontalRule') {
        if (!cursorOnLineS(state, from, to)) {
          replaces.push(Decoration.replace({ widget: new HRWidget(), block: true }).range(from, to));
        }
        return false;
      }

      // ---- Table ----
      if (name === 'Table') {
        if (!cursorInRangeS(state, from, to)) {
          const text = state.sliceDoc(from, to);
          const rows = parseTableRows(text);
          if (rows.length >= 2) {
            replaces.push(Decoration.replace({ widget: new TableWidget(rows), block: true }).range(from, to));
          }
        }
        return false;
      }
    },
  });

  // Sort
  marks.sort((a, b) => a.from - b.from || a.to - b.to);
  replaces.sort((a, b) => a.from - b.from || a.to - b.to);

  // Remove marks inside replace ranges
  const validMarks: Range<Decoration>[] = [];
  let ri = 0;
  for (const m of marks) {
    while (ri < replaces.length && replaces[ri].to <= m.from) ri++;
    if (!(ri < replaces.length && replaces[ri].from <= m.from && replaces[ri].to >= m.to)) {
      validMarks.push(m);
    }
  }

  // Remove overlapping replaces
  const validReplaces: Range<Decoration>[] = [];
  let lastEnd = -1;
  for (const r of replaces) {
    if (r.from >= lastEnd) { validReplaces.push(r); lastEnd = r.to; }
  }

  const all = [...validMarks, ...validReplaces];
  all.sort((a, b) => a.from - b.from || a.to - b.to);

  try {
    return Decoration.set(all, true);
  } catch {
    return Decoration.none;
  }
}

// ---- StateField (required for block-level decorations) ----

const wysiwygField = StateField.define<DecorationSet>({
  create() { return Decoration.none; },
  update(_value: DecorationSet, _tr: Transaction) {
    // Rebuild on every transaction — the EditorView is needed for cursor checks
    // We return Decoration.none here; actual decorations are built in the provide callback
    return _value;
  },
  provide: f => EditorView.decorations.compute([f, 'doc', 'selection'], state => {
    // We need the EditorView for cursor checks — get it from the DOM
    // Use a workaround: build decorations from state only (no visibleRanges optimization)
    return buildDecorationsFromState(state);
  }),
});

// ---- Base theme ----

const wysiwygBaseTheme = EditorView.baseTheme({
  // Headings — using line decorations so they span the full line
  '.cm-wys-h': { fontWeight: '600' },
  '.cm-wys-h1': { fontSize: '1.8em', lineHeight: '1.4' },
  '.cm-wys-h2': { fontSize: '1.5em', lineHeight: '1.4' },
  '.cm-wys-h3': { fontSize: '1.25em', lineHeight: '1.3' },
  '.cm-wys-h4': { fontSize: '1.1em', lineHeight: '1.3' },
  '.cm-wys-h5': { fontSize: '1.05em', lineHeight: '1.3' },
  '.cm-wys-h6': { fontSize: '0.95em', lineHeight: '1.3', textTransform: 'uppercase', letterSpacing: '0.5px' },

  '.cm-wys-bold': { fontWeight: '700' },
  '.cm-wys-italic': { fontStyle: 'italic' },
  '.cm-wys-strike': { textDecoration: 'line-through' },
  '.cm-wys-inlinecode': { fontFamily: 'monospace', padding: '1px 4px', borderRadius: '3px' },
  '.cm-wys-link': { textDecoration: 'underline', cursor: 'pointer' },

  // Blockquote — line decoration
  '.cm-wys-bq': { borderLeft: '3px solid', paddingLeft: '12px', fontStyle: 'italic' },

  // HR widget
  '.cm-wys-hr': { borderTop: '1px solid', margin: '12px 0', opacity: '0.3' },

  // Code block widget
  '.cm-wys-code': { borderRadius: '6px', margin: '8px 0', overflow: 'hidden', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5' },
  '.cm-wys-code pre': { margin: '0', padding: '12px 16px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  '.cm-wys-code code': { fontFamily: 'inherit', fontSize: 'inherit' },
  '.cm-wys-code-lang': { fontSize: '11px', fontFamily: '-apple-system, sans-serif', padding: '4px 12px', opacity: '0.5', textTransform: 'uppercase', letterSpacing: '0.5px' },

  // Table widget
  '.cm-wys-table': { borderCollapse: 'collapse', margin: '8px 0', fontSize: '13px', width: '100%' },
  '.cm-wys-table th, .cm-wys-table td': { padding: '6px 12px', textAlign: 'left' },
  '.cm-wys-table th': { fontWeight: '600' },

  // Properties widget
  '.cm-wys-props': { borderRadius: '6px', margin: '0 0 8px', overflow: 'hidden', fontSize: '13px' },
  '.cm-wys-props-hdr': { fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '6px 12px', opacity: '0.5' },
  '.cm-wys-props-row': { display: 'flex', padding: '3px 12px', gap: '12px', alignItems: 'baseline' },
  '.cm-wys-props-key': { fontWeight: '500', minWidth: '100px', flexShrink: '0', opacity: '0.7' },
  '.cm-wys-props-val': { flex: '1' },
});

// ---- Theme colors ----

const darkColors = EditorView.theme({
  '.cm-wys-inlinecode': { background: 'rgba(255,255,255,0.08)' },
  '.cm-wys-link': { color: '#7aa2f7' },
  '.cm-wys-bq': { borderColor: '#444', color: '#aaa' },
  '.cm-wys-hr': { borderColor: '#444' },
  '.cm-wys-code': { background: '#161616', border: '1px solid #2a2a2a' },
  '.cm-wys-code code': { color: '#d4d4d4' },
  '.cm-wys-table th, .cm-wys-table td': { border: '1px solid #333' },
  '.cm-wys-table th': { background: '#1a1a1a' },
  '.cm-wys-props': { background: '#141414', border: '1px solid #2a2a2a' },
  '.cm-wys-props-row:nth-child(odd)': { background: 'rgba(255,255,255,0.02)' },
}, { dark: true });

const lightColors = EditorView.theme({
  '.cm-wys-inlinecode': { background: 'rgba(0,0,0,0.06)' },
  '.cm-wys-link': { color: '#0969da' },
  '.cm-wys-bq': { borderColor: '#ddd', color: '#666' },
  '.cm-wys-hr': { borderColor: '#ddd' },
  '.cm-wys-code': { background: '#f5f5f5', border: '1px solid #e5e5e5' },
  '.cm-wys-code code': { color: '#333' },
  '.cm-wys-table th, .cm-wys-table td': { border: '1px solid #e5e5e5' },
  '.cm-wys-table th': { background: '#f9f9f9' },
  '.cm-wys-props': { background: '#f8f8f8', border: '1px solid #e5e5e5' },
  '.cm-wys-props-row:nth-child(odd)': { background: 'rgba(0,0,0,0.02)' },
});

// ---- Public API ----

export function wysiwygExtension(theme: 'dark' | 'light'): Extension {
  return [wysiwygField, wysiwygBaseTheme, theme === 'dark' ? darkColors : lightColors];
}
