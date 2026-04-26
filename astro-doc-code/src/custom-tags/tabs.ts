/**
 * Tabs Tag Transformer
 * Transforms <tabs> and <tab> tags into tabbed content interfaces
 *
 * Usage:
 *   <tabs>
 *     <tab label="JavaScript">JS content here</tab>
 *     <tab label="TypeScript">TS content here</tab>
 *     <tab label="Python">Python content here</tab>
 *   </tabs>
 *
 * With default tab:
 *   <tabs default="typescript">
 *     <tab id="javascript" label="JavaScript">...</tab>
 *     <tab id="typescript" label="TypeScript">...</tab>
 *   </tabs>
 *
 * Synced tabs (tabs with same group stay in sync):
 *   <tabs group="language">
 *     <tab label="JavaScript">...</tab>
 *     <tab label="Python">...</tab>
 *   </tabs>
 */

import type { TagTransformer } from '../parsers/types';

export interface TabsOptions {
  /** Custom class prefix */
  classPrefix?: string;
}

// Counter for generating unique IDs
let tabsCounter = 0;

/**
 * Parse individual tab items from tabs content
 */
function parseTabItems(content: string): Array<{ id: string; label: string; content: string }> {
  const tabs: Array<{ id: string; label: string; content: string }> = [];

  // Match <tab ...>content</tab> patterns
  const tabPattern = /<tab\s+([^>]*)>([\s\S]*?)<\/tab>/gi;

  let match;
  while ((match = tabPattern.exec(content)) !== null) {
    const [, attrsStr, tabContent] = match;

    // Parse attributes
    const attrs = parseAttributes(attrsStr);
    const label = attrs.label || `Tab ${tabs.length + 1}`;
    const id = attrs.id || slugify(label);

    tabs.push({
      id,
      label,
      content: tabContent.trim(),
    });
  }

  return tabs;
}

/**
 * Parse HTML-style attributes from a string
 */
function parseAttributes(attrsStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};

  if (!attrsStr || !attrsStr.trim()) {
    return attrs;
  }

  const attrPattern = /(\w+)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;

  let match;
  while ((match = attrPattern.exec(attrsStr)) !== null) {
    const [, name, doubleQuoted, singleQuoted, unquoted] = match;
    const value = doubleQuoted ?? singleQuoted ?? unquoted ?? 'true';
    attrs[name] = value;
  }

  return attrs;
}

/**
 * Generate a URL-friendly slug from text
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Create a tabs tag transformer
 */
export function createTabsTransformer(options: TabsOptions = {}): TagTransformer {
  const { classPrefix = 'tabs' } = options;

  return {
    tag: 'tabs',
    transform(content: string, attrs: Record<string, string>): string {
      const tabs = parseTabItems(content);

      if (tabs.length === 0) {
        return `<div class="${classPrefix} ${classPrefix}--empty">No tabs defined</div>`;
      }

      // Generate unique ID for this tabs instance
      const tabsId = `tabs-${++tabsCounter}`;
      const defaultTab = attrs.default || tabs[0].id;
      const group = attrs.group || '';

      // Build tab buttons
      const tabButtons = tabs
        .map((tab, index) => {
          const isActive = tab.id === defaultTab;
          const activeClass = isActive ? `${classPrefix}__button--active` : '';
          return `<button
            class="${classPrefix}__button ${activeClass}"
            data-tab="${tab.id}"
            data-tabs-id="${tabsId}"
            ${group ? `data-tabs-group="${group}"` : ''}
            role="tab"
            aria-selected="${isActive}"
            aria-controls="${tabsId}-panel-${tab.id}"
            id="${tabsId}-tab-${tab.id}"
          >${tab.label}</button>`;
        })
        .join('\n');

      // Build tab panels
      const tabPanels = tabs
        .map((tab) => {
          const isActive = tab.id === defaultTab;
          const hiddenAttr = isActive ? '' : 'hidden';
          return `<div
            class="${classPrefix}__panel"
            data-tab="${tab.id}"
            data-tabs-id="${tabsId}"
            role="tabpanel"
            aria-labelledby="${tabsId}-tab-${tab.id}"
            id="${tabsId}-panel-${tab.id}"
            ${hiddenAttr}
          >${tab.content}</div>`;
        })
        .join('\n');

      return `
<div class="${classPrefix}" data-tabs-id="${tabsId}" ${group ? `data-tabs-group="${group}"` : ''}>
  <div class="${classPrefix}__list" role="tablist">
    ${tabButtons}
  </div>
  <div class="${classPrefix}__panels">
    ${tabPanels}
  </div>
</div>`.trim();
    },
  };
}

/**
 * Create a tab transformer (for individual tab items)
 * This is a no-op since tabs are parsed by the parent tabs transformer
 */
export function createTabTransformer(): TagTransformer {
  return {
    tag: 'tab',
    transform(content: string, _attrs: Record<string, string>): string {
      // Individual tabs should be processed by the parent tabs transformer
      // If we get here, it means a <tab> was used outside of <tabs>
      return `<div class="tab--orphan">${content}</div>`;
    },
  };
}

// Default instances
export const tabsTransformer = createTabsTransformer();
export const tabTransformer = createTabTransformer();
