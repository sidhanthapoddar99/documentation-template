---
title: Custom Tags
description: Using and defining custom HTML-like tags in markdown
sidebar_position: 3
---

# Custom Tags

Custom tags are HTML-like elements that transform into semantic HTML during processing. They provide reusable components for common patterns.

## How It Works

Custom tags are processed by the [Transformer system](/docs/architecture/parser/transformers) during post-processing:

```
<callout type="warning">Be careful!</callout>
        │
        ▼
<div class="callout callout--warning">Be careful!</div>
```

## Using Custom Tags

### Basic Syntax

```markdown
<tagname attribute="value">Content here</tagname>
```

### Self-Closing Tags

```markdown
<tagname attribute="value" />
```

## Available Tags

| Tag | Purpose | Example |
|-----|---------|---------|
| `<callout>` | Info boxes, warnings, tips | `<callout type="warning">...</callout>` |
| `<tabs>` | Tabbed content container | `<tabs>...</tabs>` |
| `<tab>` | Individual tab | `<tab label="JS">...</tab>` |
| `<collapsible>` | Expandable sections | `<collapsible title="Details">...</collapsible>` |

### Callout

```markdown
<callout type="info">
This is informational content.
</callout>

<callout type="warning">
Be careful about this.
</callout>

<callout type="danger">
This is dangerous!
</callout>

<callout type="tip">
Here's a helpful tip.
</callout>
```

**Types:** `info`, `warning`, `danger`, `tip`

### Tabs

```markdown
<tabs>
  <tab label="JavaScript">
    ```javascript
    console.log("Hello");
    ```
  </tab>
  <tab label="Python">
    ```python
    print("Hello")
    ```
  </tab>
</tabs>
```

### Collapsible

```markdown
<collapsible title="Click to expand">
Hidden content that can be revealed.
</collapsible>
```

## Defining Custom Tags

You can create your own custom tags by registering them with the transformer registry.

### Basic Definition

```typescript
import { globalRegistry } from '@parsers/transformers';

globalRegistry.register({
  tag: 'badge',
  transform(content, attrs) {
    const color = attrs.color || 'blue';
    return `<span class="badge badge--${color}">${content}</span>`;
  }
});
```

**Usage:**

```markdown
<badge color="green">New</badge>
```

### Transformer Interface

```typescript
interface TagTransformer {
  tag: string;  // Tag name to match
  transform: (content: string, attrs: Record<string, string>) => string;
}
```

- `content` - Text between opening and closing tags
- `attrs` - Parsed HTML attributes as key-value pairs

For detailed documentation on creating custom transformers, see the [Transformers](/docs/architecture/parser/transformers) section.

## Best Practices

1. **Use semantic names** - `<callout>` not `<box>`
2. **Keep attributes simple** - Use predefined types when possible
3. **Document your tags** - List available options
4. **Test rendering** - Verify output in both themes
