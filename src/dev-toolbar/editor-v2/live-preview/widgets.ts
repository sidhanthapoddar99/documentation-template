/**
 * Live Preview — small inline/block widgets
 * Only used for elements that genuinely need DOM replacement:
 * checkboxes, horizontal rules, frontmatter properties.
 */

import { WidgetType } from '@codemirror/view';

/** Checkbox widget — replaces `[ ]` or `[x]` inline */
export class CheckboxWidget extends WidgetType {
  constructor(public checked: boolean) { super(); }
  toDOM() {
    const el = document.createElement('span');
    el.className = `cm-lp-checkbox${this.checked ? ' cm-lp-checkbox-checked' : ''}`;
    el.setAttribute('aria-label', this.checked ? 'Completed' : 'Incomplete');
    // Tick SVG for checked state
    if (this.checked) {
      el.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3.5 8.5 6.5 11.5 12.5 5.5"/></svg>`;
    }
    return el;
  }
  eq(other: CheckboxWidget) { return this.checked === other.checked; }
  ignoreEvent() { return false; }
}

/** Horizontal rule — replaces `---` / `***` / `___` */
export class HRWidget extends WidgetType {
  toDOM() {
    const el = document.createElement('hr');
    el.className = 'cm-lp-hr';
    return el;
  }
  eq() { return true; }
}

/** Frontmatter properties — replaces YAML block */
export class PropertiesWidget extends WidgetType {
  constructor(private props: [string, string][]) { super(); }
  toDOM() {
    const box = document.createElement('div');
    box.className = 'cm-lp-props';

    const hdr = document.createElement('div');
    hdr.className = 'cm-lp-props-hdr';
    hdr.textContent = 'Properties';
    box.appendChild(hdr);

    for (const [k, v] of this.props) {
      const row = document.createElement('div');
      row.className = 'cm-lp-props-row';

      const key = document.createElement('span');
      key.className = 'cm-lp-props-key';
      key.textContent = k;

      const val = document.createElement('span');
      val.className = 'cm-lp-props-val';
      val.textContent = v || '—';

      row.appendChild(key);
      row.appendChild(val);
      box.appendChild(row);
    }
    return box;
  }
  eq(other: PropertiesWidget) {
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
  ignoreEvent() { return false; }
}
