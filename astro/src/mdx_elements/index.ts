// MDX Elements - Components for use in MDX documentation

// Card components
export { default as Card } from './Card/Card.astro';
export { default as CardGrid } from './Card/CardGrid.astro';
export { default as FeatureCard } from './Card/FeatureCard.astro';

// Callout components
export { default as Callout } from './Callout/Callout.astro';
export { default as CalloutCollapsible } from './Callout/CalloutCollapsible.astro';
export { default as Tip } from './Callout/Tip.astro';

// Code block components
export { default as CodeBlock } from './CodeBlock/CodeBlock.astro';
export { default as CollapsibleCodeBlock } from './CodeBlock/CollapsibleCodeBlock.astro';
export { default as CodeTabs } from './CodeBlock/CodeTabs.astro';

// Tab components
export { default as Tabs } from './Tabs/Tabs.astro';
export { default as TabItem } from './Tabs/TabItem.astro';

/**
 * Component Summary:
 *
 * Cards:
 * - Card: Basic content card with optional title/icon
 * - CardGrid: Grid layout for multiple cards (2-4 columns)
 * - FeatureCard: Icon + title + description card
 *
 * Callouts:
 * - Callout: Info/warning/danger/success/tip callouts
 * - CalloutCollapsible: Expandable callout with details
 * - Tip: Lightweight inline tip component
 *
 * Code Blocks:
 * - CodeBlock: Syntax-highlighted code with copy button
 * - CollapsibleCodeBlock: Expandable code block
 * - CodeTabs: Tabbed code blocks for multiple languages
 *
 * Tabs:
 * - Tabs: Container for tabbed content
 * - TabItem: Individual tab panel
 */
