/**
 * Callout Tag Transformer
 * Transforms <callout> tags into styled admonition boxes
 *
 * Usage:
 *   <callout type="info" title="Note">Content here</callout>
 *   <callout type="warning">Warning content</callout>
 *   <callout type="tip" title="Pro Tip">Helpful tip</callout>
 *   <callout type="danger">Danger content</callout>
 *
 * Types: info (default), warning, tip, danger, note
 */

import type { TagTransformer } from '../parsers/types';

export interface CalloutOptions {
  /** Default callout type if not specified */
  defaultType?: CalloutType;
  /** Custom class prefix */
  classPrefix?: string;
}

export type CalloutType = 'info' | 'warning' | 'tip' | 'danger' | 'note';

const CALLOUT_ICONS: Record<CalloutType, string> = {
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  tip: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  danger: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
  note: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`,
};

const DEFAULT_TITLES: Record<CalloutType, string> = {
  info: 'Info',
  warning: 'Warning',
  tip: 'Tip',
  danger: 'Danger',
  note: 'Note',
};

/**
 * Create a callout tag transformer
 */
export function createCalloutTransformer(options: CalloutOptions = {}): TagTransformer {
  const { defaultType = 'info', classPrefix = 'callout' } = options;

  return {
    tag: 'callout',
    transform(content: string, attrs: Record<string, string>): string {
      const type = (attrs.type as CalloutType) || defaultType;
      const title = attrs.title || DEFAULT_TITLES[type] || DEFAULT_TITLES.info;
      const icon = CALLOUT_ICONS[type] || CALLOUT_ICONS.info;
      const collapsible = attrs.collapsible === 'true';

      if (collapsible) {
        return `
<details class="${classPrefix} ${classPrefix}--${type}">
  <summary class="${classPrefix}__header">
    <span class="${classPrefix}__icon">${icon}</span>
    <span class="${classPrefix}__title">${title}</span>
  </summary>
  <div class="${classPrefix}__content">${content}</div>
</details>`.trim();
      }

      return `
<div class="${classPrefix} ${classPrefix}--${type}">
  <div class="${classPrefix}__header">
    <span class="${classPrefix}__icon">${icon}</span>
    <span class="${classPrefix}__title">${title}</span>
  </div>
  <div class="${classPrefix}__content">${content}</div>
</div>`.trim();
    },
  };
}

// Default instance
export const calloutTransformer = createCalloutTransformer();
