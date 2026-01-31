---
title: MDX Components Overview
description: Using components in your documentation
---

# MDX Components

MDX lets you use React/Astro components directly in markdown content.

## What is MDX?

MDX combines Markdown with JSX:

```mdx
# Regular Markdown

This is normal markdown text.

<Callout type="info">
  But you can also use components!
</Callout>
```

## Built-in Markdown

These work without any imports:

### Text Formatting

```mdx
**Bold text**
*Italic text*
~~Strikethrough~~
`inline code`
```

**Bold text**, *Italic text*, ~~Strikethrough~~, `inline code`

### Lists

```mdx
- Unordered item 1
- Unordered item 2
  - Nested item

1. Ordered item 1
2. Ordered item 2
```

### Links and Images

```mdx
[Link text](https://example.com)

![Alt text](/images/example.png)
```

### Code Blocks

````mdx
```javascript
const hello = "world";
console.log(hello);
```
````

### Tables

```mdx
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

### Blockquotes

```mdx
> This is a blockquote
> spanning multiple lines.
```

## Using Custom Components

Import components at the top of your MDX file:

```mdx
---
title: My Page
---

import { Callout } from '@components/Callout';
import { CodeTabs, Tab } from '@components/CodeTabs';

# My Page

<Callout type="info">
  This is an informational callout.
</Callout>
```

## Common Components

### Callout / Admonition

Highlight important information:

```mdx
<Callout type="note">
  A helpful note for the reader.
</Callout>

<Callout type="warning">
  Be careful with this operation!
</Callout>

<Callout type="tip">
  Here's a pro tip.
</Callout>

<Callout type="danger">
  This action cannot be undone.
</Callout>
```

**Types available:** `note`, `tip`, `warning`, `danger`, `info`

### Code Tabs

Show code in multiple languages:

```mdx
<CodeTabs>
  <Tab label="JavaScript">
    ```javascript
    const x = 1;
    ```
  </Tab>
  <Tab label="TypeScript">
    ```typescript
    const x: number = 1;
    ```
  </Tab>
  <Tab label="Python">
    ```python
    x = 1
    ```
  </Tab>
</CodeTabs>
```

### Cards

Link to related content:

```mdx
<CardGrid>
  <Card title="Getting Started" href="/docs/getting-started">
    Learn the basics of the template.
  </Card>
  <Card title="Configuration" href="/docs/configuration">
    Customize your documentation site.
  </Card>
</CardGrid>
```

### Steps

Numbered instructions:

```mdx
<Steps>
  <Step title="Install dependencies">
    Run `npm install` in your terminal.
  </Step>
  <Step title="Configure settings">
    Edit `config/site.yaml` with your details.
  </Step>
  <Step title="Start development">
    Run `npm run dev` to start the server.
  </Step>
</Steps>
```

## Creating Custom Components

### 1. Create Component File

`src/components/MyComponent.astro`:

```astro
---
interface Props {
  title: string;
  variant?: 'default' | 'highlight';
}

const { title, variant = 'default' } = Astro.props;
---

<div class={`my-component my-component--${variant}`}>
  <h3>{title}</h3>
  <div class="content">
    <slot />
  </div>
</div>

<style>
  .my-component {
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--color-border);
  }

  .my-component--highlight {
    background: var(--color-bg-secondary);
    border-left: 4px solid var(--color-brand-primary);
  }

  .my-component h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }

  .content {
    color: var(--color-text-secondary);
  }
</style>
```

### 2. Export from Index

`src/components/index.ts`:

```typescript
export { default as MyComponent } from './MyComponent.astro';
```

### 3. Use in MDX

```mdx
import { MyComponent } from '@components';

<MyComponent title="Example" variant="highlight">
  Content goes here.
</MyComponent>
```

## Component Guidelines

### Keep Components Simple

Documentation components should enhance readability, not complicate it.

```astro
// Good - clear purpose
<Callout type="warning">
  Important message here.
</Callout>

// Avoid - too many options
<Callout
  type="warning"
  color="yellow"
  icon="alert"
  borderStyle="dashed"
  animate={true}
>
```

### Use Semantic Props

```astro
// Good - semantic meaning
<Callout type="warning">

// Avoid - implementation details
<Callout color="yellow" icon="alert">
```

### Provide Fallbacks

For graceful degradation if components fail:

```mdx
<Callout type="note">
  **Note:** Important information here.
</Callout>
```

The inner text remains readable even without the component styling.

### Document Your Components

When creating components, document:
- Purpose and use case
- Required and optional props
- Example usage
- Visual variants

## Best Practices

1. **Import at top** - Keep imports organized
2. **Use sparingly** - Don't over-componentize
3. **Stay accessible** - Ensure components work with screen readers
4. **Test rendering** - Verify MDX compiles correctly
5. **Match theme** - Use CSS variables for colors
