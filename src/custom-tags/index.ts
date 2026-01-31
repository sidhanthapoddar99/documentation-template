/**
 * Custom Tags Module
 * Exports all custom tag transformers
 */

export {
  createCalloutTransformer,
  calloutTransformer,
  type CalloutOptions,
  type CalloutType,
} from './callout';

export {
  createTabsTransformer,
  createTabTransformer,
  tabsTransformer,
  tabTransformer,
  type TabsOptions,
} from './tabs';

export {
  createCollapsibleTransformer,
  collapsibleTransformer,
  type CollapsibleOptions,
} from './collapsible';

// ============================================
// Pre-configured registry with all custom tags
// ============================================

import { TagTransformerRegistry } from '../parsers/transformers/registry';
import { calloutTransformer } from './callout';
import { tabsTransformer, tabTransformer } from './tabs';
import { collapsibleTransformer } from './collapsible';

/**
 * Create a registry with all custom tags pre-registered
 */
export function createCustomTagsRegistry(): TagTransformerRegistry {
  const registry = new TagTransformerRegistry();

  // Register all custom tags
  registry.register(calloutTransformer);
  registry.register(tabsTransformer);
  registry.register(tabTransformer);
  registry.register(collapsibleTransformer);

  return registry;
}

/**
 * Get all custom tag transformers as an array
 */
export function getAllCustomTags() {
  return [
    calloutTransformer,
    tabsTransformer,
    tabTransformer,
    collapsibleTransformer,
  ];
}
