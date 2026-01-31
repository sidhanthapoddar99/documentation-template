---
title: Component Architecture
description: Why we chose parser-based transforms over MDX and Web Components
---

# Component Architecture

This document explains the architectural decisions behind our custom component system and why we chose the **parser transform** approach over alternatives.

## The Problem

Documentation sites need reusable components like:

- Code blocks with syntax highlighting
- Collapsible sections
- Callouts and alerts
- Tabbed content
- File embeddings

The question: **How do we enable custom components in markdown?**

## Options Considered

We evaluated three approaches:

### Option 1: MDX with JSX Components

**How it works:** MDX compiles markdown + JSX together, allowing React/Astro component imports.

```markdown
import CodeBlock from '@/components/CodeBlock';
import Callout from '@/components/Callout';

# My Doc

<CodeBlock language="python" title="example.py">
  {`print("hello")`}
</CodeBlock>

<Callout type="warning">
  Be careful!
</Callout>
```

**Pros:**

- Most flexible and powerful
- Full component ecosystem
- Can use any React/Astro component

**Cons:**

- Slowest build times (full AST parsing and compilation)
- Largest bundle sizes (may include React runtime)
- Complex syntax (imports, JSX rules, curly braces)
- Mixing markdown and JSX is error-prone
- Hard for AI to generate correctly
- Requires `.mdx` extension

### Option 2: Web Components (Custom Elements)

**How it works:** Define custom HTML elements with JavaScript that the browser upgrades at runtime.

```markdown
# My Doc

<code-block language="python" title="example.py">
  print("hello")
</code-block>

<callout-box type="warning">
  Be careful!
</callout-box>
```

```javascript
// Separate JS file
class CodeBlock extends HTMLElement {
  connectedCallback() {
    // Render component
  }
}
customElements.define('code-block', CodeBlock);
```

**Pros:**

- Browser standard (works everywhere)
- Clean HTML-like syntax
- No build step for the components themselves

**Cons:**

- Requires JavaScript at runtime
- Custom elements must have hyphens (`code-block`, not `codeblock`)
- Need separate JS files to define each component
- Behavior defined outside of markdown
- Hydration complexity for SSG sites

### Option 3: Parser Transform (Chosen)

**How it works:** Custom tags in markdown are transformed to plain HTML during the build process.

```markdown
# My Doc

<codeblock language="python" title="example.py">
print("hello")
</codeblock>

<callout type="warning">
Be careful!
</callout>
```

Gets transformed at build time to:

```html
<div class="codeblock">
  <div class="codeblock-header">example.py</div>
  <pre><code class="language-python">print("hello")</code></pre>
</div>

<div class="callout callout-warning">
  <p>Be careful!</p>
</div>
```

**Pros:**

- Zero runtime JavaScript needed
- Fastest builds (simple string transforms)
- Smallest output (plain HTML + CSS)
- Cleanest syntax for authors
- Works in plain `.md` files
- Most AI-friendly (simple, predictable patterns)
- Full control over output HTML
- Easy to customize and extend

**Cons:**

- Components are static (no client interactivity without adding JS)
- Need to implement transforms manually
- Less flexible than full JSX

## Comparison Summary

| Criteria | MDX + JSX | Web Components | Parser Transform |
|----------|-----------|----------------|------------------|
| **Build Performance** | Slow | Fast | Fast |
| **Runtime Performance** | Varies | JS overhead | Zero overhead |
| **Bundle Size** | Large | Medium | Small |
| **Syntax Simplicity** | Complex | Medium | Simple |
| **AI-Friendly** | Poor | Good | Excellent |
| **File Extension** | `.mdx` only | `.md` or `.mdx` | `.md` or `.mdx` |
| **Interactivity** | Full | Full | CSS-only* |
| **Learning Curve** | Steep | Medium | Low |

*Interactive features like collapsible sections use CSS (`:target`, `<details>`) or minimal JS.

## Why We Chose Parser Transform

For a documentation system, the priorities are:

1. **Fast builds** - Docs can have hundreds of pages
2. **Simple authoring** - Writers shouldn't need to learn JSX
3. **AI compatibility** - LLMs should easily generate correct syntax
4. **Minimal JS** - Documentation is mostly static content
5. **Plain markdown** - Keep files portable and tool-agnostic

The parser transform approach excels at all of these.

### Performance Wins

- No MDX compilation overhead
- No component tree reconciliation
- Output is pure HTML that browsers render instantly
- Smaller page sizes = faster load times

### Authoring Wins

```markdown
// Simple and clean
<codeblock language="python">
[[./assets/example.py]]
</codeblock>

// vs MDX complexity
import { CodeBlock } from '@/components';

<CodeBlock language="python">
{fs.readFileSync('./assets/example.py')}
</CodeBlock>
```

### AI Wins

When asking an AI to write documentation:

- Parser syntax: AI writes simple HTML-like tags ✓
- MDX syntax: AI must handle imports, JSX rules, escaping ✗

## Implementation

The transform happens in `src/loaders/data.ts`:

1. Content is loaded from `.md` or `.mdx` files
2. `[[path]]` syntax is replaced with file contents
3. Custom tags are transformed to semantic HTML
4. Result is passed through markdown renderer
5. Final HTML is rendered in the page

This keeps the complexity in one place (the data loader) and gives authors a simple, consistent syntax.

## When to Use MDX Instead

MDX is still valuable when you need:

- Highly interactive components (forms, live code editors)
- Components with complex state management
- Integration with React ecosystem libraries
- Dynamic content based on props/context

For these cases, use `.mdx` files with imported components.

## Conclusion

The parser transform approach gives us the best balance of:

- Performance (fast builds, zero runtime JS)
- Simplicity (clean syntax, works in `.md`)
- Maintainability (transforms in one place)
- AI compatibility (predictable patterns)

For documentation, this is the right trade-off. Save MDX for when you truly need its power.
