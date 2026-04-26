---
title: Page Outline
description: Auto-generated table of contents from headings
sidebar_position: 4
---

# Page Outline

The page outline (table of contents) is automatically generated from your document's headings.

## How It Works

The outline is built by scanning your document for heading elements:

```
Document                    Outline
─────────                   ───────
# Page Title                (excluded - H1)
## Introduction         →   • Introduction
## Getting Started      →   • Getting Started
### Installation        →     • Installation
### Configuration       →     • Configuration
## Advanced             →   • Advanced
#### Deep Nesting           (excluded - H4+)
```

## Included Headings

| Heading Level | Included in Outline |
|---------------|---------------------|
| H1 (`#`) | No - Page title, not navigation |
| H2 (`##`) | Yes - Main sections |
| H3 (`###`) | Yes - Subsections |
| H4+ (`####`) | No - Too deep for navigation |

## Writing for Good Outlines

### Use Descriptive Headings

```markdown
<!-- Good - clear and descriptive -->
## Authentication Setup
### Configure OAuth Provider
### Generate API Keys

<!-- Bad - vague -->
## Setup
### Step 1
### Step 2
```

### Maintain Hierarchy

```markdown
<!-- Good - proper hierarchy -->
## Main Section
### Subsection
### Another Subsection

<!-- Bad - skipped level -->
## Main Section
#### Jumped to H4
```

### Keep Headings Concise

```markdown
<!-- Good - scannable -->
## Installation
## Configuration
## Troubleshooting

<!-- Bad - too long -->
## How to Install the Application on Your System
## Configuring All the Settings You Need
## What to Do When Things Go Wrong
```

## Heading IDs

Headings automatically get IDs for anchor links:

```markdown
## Getting Started
```

Becomes:

```html
<h2 id="getting-started">Getting Started</h2>
```

### Linking to Sections

Link to any heading using its ID:

```markdown
See the [Installation](#installation) section.
```

### ID Generation Rules

| Heading | Generated ID |
|---------|--------------|
| `## Getting Started` | `getting-started` |
| `## API Reference` | `api-reference` |
| `## OAuth 2.0 Setup` | `oauth-20-setup` |

- Lowercase
- Spaces become hyphens
- Special characters removed

## Best Practices

1. **Start with H2** - Reserve H1 for the page title
2. **Be descriptive** - Headings should make sense out of context
3. **Keep it short** - 3-5 words per heading
4. **Use consistent style** - "Installing X" vs "How to Install X"
5. **Don't skip levels** - H2 → H3, not H2 → H4
