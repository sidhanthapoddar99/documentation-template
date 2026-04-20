---
title: Custom Tags
description: HTML-like tags that expand into semantic components
sidebar_position: 4
---

# Custom Tags

Custom tags are HTML-like elements that expand into styled components during preprocessing. They give you reusable patterns (callouts, tabs, collapsibles) without hand-authoring the HTML.

## How It Works

```
<callout type="warning">Be careful!</callout>
        │
        ▼
<div class="callout callout--warning">Be careful!</div>
```

Registered tags are recognised and rewritten before markdown rendering. Unknown tags are left alone (markdown treats them as raw HTML).

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

You can register your own custom tags on the transformer registry:

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

- `content` — text between opening and closing tags
- `attrs` — parsed HTML attributes as key-value pairs

## Best Practices

1. **Use semantic names** — `<callout>` not `<box>`
2. **Keep attributes simple** — use predefined types when possible
3. **Document your tags** — list available options
4. **Test rendering** — verify output in both light and dark themes
