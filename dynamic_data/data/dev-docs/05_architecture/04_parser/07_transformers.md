---
title: "Step 3: Transformers"
description: Custom tag transformers that convert semantic tags to HTML
sidebar_position: 7
---

# Transformers

**Folder:** `src/parsers/transformers/`

Transformers convert custom HTML-like tags into semantic HTML. They run as part of the postprocessing stage.

## Role in the Pipeline

```
┌─────────────────┐
│ POSTPROCESSORS  │
│                 │
│ • heading-ids   │
│ • external-links│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  TRANSFORMERS   │  ◀── YOU ARE HERE
│                 │
│ • callout       │
│ • tabs          │
│ • collapsible   │
│ (Custom tags)   │
└─────────────────┘
```

## Key Insight

**Transformers are postprocessors** - the `TagTransformerRegistry` provides a `createProcessor()` method that wraps the transformer as a standard `Processor` for the pipeline.

## Transformer Files

| File | Purpose |
|------|---------|
| `registry.ts` | `TagTransformerRegistry` class - manages custom tag transformers |
| `index.ts` | Module exports (re-exports from `custom-tags/`) |

## How It Works

Transformers match custom HTML-like tags and replace them with semantic HTML:

```html
<!-- Input (in markdown) -->
<callout type="warning">This is a warning</callout>

<!-- Output (after transformation) -->
<div class="callout callout--warning">This is a warning</div>
```

## TagTransformerRegistry

The registry manages all custom tag transformers:

```typescript
import { TagTransformerRegistry, createTransformerRegistry } from '@parsers/transformers';

const registry = new TagTransformerRegistry();

// Register a transformer
registry.register({
  tag: 'callout',
  transform(content, attrs) {
    const type = attrs.type || 'info';
    return `<div class="callout callout--${type}">${content}</div>`;
  }
});

// Check if registered
registry.has('callout');  // true

// Get all registered tags
registry.getTags();  // ['callout']

// Transform all tags in HTML
const html = registry.transformAll(inputHtml);

// Create a processor for the pipeline
const processor = registry.createProcessor();
pipeline.addPostprocessor(processor);
```

## Available Transformers

Custom tags are defined in `src/custom-tags/`:

| Transformer | Tag | Purpose |
|-------------|-----|---------|
| Callout | `<callout>` | Info boxes, warnings, tips |
| Tabs | `<tabs>`, `<tab>` | Tabbed content |
| Collapsible | `<collapsible>` | Expandable sections |

### Callout

```html
<callout type="info">This is informational</callout>
<callout type="warning">This is a warning</callout>
<callout type="danger">This is dangerous</callout>
<callout type="tip">This is a tip</callout>
```

### Tabs

```html
<tabs>
  <tab label="JavaScript">
    JavaScript content here
  </tab>
  <tab label="Python">
    Python content here
  </tab>
</tabs>
```

### Collapsible

```html
<collapsible title="Click to expand">
  Hidden content here
</collapsible>
```

## Creating Custom Transformers

### Transformer Interface

```typescript
interface TagTransformer {
  tag: string;
  transform: (content: string, attrs: Record<string, string>) => string;
}
```

### Example: Badge Transformer

```typescript
import { globalRegistry } from '@parsers/transformers';

globalRegistry.register({
  tag: 'badge',
  transform(content, attrs) {
    const color = attrs.color || 'blue';
    return `<span class="badge badge--${color}">${content}</span>`;
  }
});

// Usage in markdown:
// <badge color="green">New</badge>
// → <span class="badge badge--green">New</span>
```

### Example: Alert Transformer

```typescript
const alertTransformer: TagTransformer = {
  tag: 'alert',
  transform(content, attrs) {
    const type = attrs.type || 'info';
    const title = attrs.title || '';
    const titleHtml = title ? `<strong>${title}</strong>` : '';
    return `<div class="alert alert--${type}">${titleHtml}${content}</div>`;
  }
};

registry.register(alertTransformer);

// Usage:
// <alert type="warning" title="Attention">Be careful!</alert>
```

## Self-Closing Tags

Transformers support both self-closing and content tags:

```html
<!-- Self-closing -->
<divider />

<!-- With content -->
<callout>Some content</callout>
```

## Attribute Parsing

The registry automatically parses HTML-style attributes:

```html
<tag attr="value" flag standalone>content</tag>
```

Parsed as:
```typescript
{
  attr: 'value',
  flag: 'true',
  standalone: 'true'
}
```

## Global Registry

A global registry instance is available for convenience:

```typescript
import { globalRegistry } from '@parsers/transformers';

// Register globally
globalRegistry.register(myTransformer);

// Use in pipeline
pipeline.addPostprocessor(globalRegistry.createProcessor());
```

## Factory Functions

```typescript
import {
  createCalloutTransformer,
  createTabsTransformer,
  createCollapsibleTransformer,
  createCustomTagsRegistry,
} from '@parsers/transformers';

// Create individual transformers
const callout = createCalloutTransformer({ defaultType: 'info' });

// Create a registry with all custom tags pre-registered
const registry = createCustomTagsRegistry();

// Get list of all custom tags
import { getAllCustomTags } from '@parsers/transformers';
const tags = getAllCustomTags();  // ['callout', 'tabs', 'tab', 'collapsible']
```
