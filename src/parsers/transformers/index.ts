/**
 * Transformers module exports
 *
 * The transformer system provides custom HTML tag transformation.
 * Custom tags are transformed to semantic HTML during postprocessing.
 */

export {
  TagTransformerRegistry,
  createTransformerRegistry,
  globalRegistry,
} from './registry';

// Custom tags
export {
  // Callout
  createCalloutTransformer,
  calloutTransformer,
  type CalloutOptions,
  type CalloutType,
  // Tabs
  createTabsTransformer,
  createTabTransformer,
  tabsTransformer,
  tabTransformer,
  type TabsOptions,
  // Collapsible
  createCollapsibleTransformer,
  collapsibleTransformer,
  type CollapsibleOptions,
  // Registry helpers
  createCustomTagsRegistry,
  getAllCustomTags,
} from '../../custom-tags';
