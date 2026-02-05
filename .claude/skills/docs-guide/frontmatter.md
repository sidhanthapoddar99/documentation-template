# Frontmatter Reference

Every markdown doc file needs YAML frontmatter at the top, enclosed in triple dashes.

## Basic Structure

```yaml
---
title: Page Title
description: Brief description for SEO
---

# Page Title

Content starts here...
```

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Page title (appears in sidebar and browser tab) |

## Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `description` | string | `""` | SEO meta description (keep under 160 chars) |
| `sidebar_label` | string | `title` | Override text shown in sidebar |
| `draft` | boolean | `false` | Hide page in production builds |
| `tags` | string[] | `[]` | Tags for search indexing |

## Field Details

### `title` (Required)

The main title for the page. Used in:
- Browser tab
- Sidebar navigation
- Search results

```yaml
---
title: Getting Started with the API
---
```

### `description`

Brief description for SEO and link previews.

```yaml
---
title: Authentication Guide
description: Learn how to authenticate API requests using tokens and API keys
---
```

### `sidebar_label`

Override the sidebar text without changing the page title. Useful for long titles.

```yaml
---
title: Comprehensive Guide to Authentication and Authorization
sidebar_label: Auth Guide
---
```

### `draft`

Mark a page as draft to hide it in production (still visible in development).

```yaml
---
title: Upcoming Feature
draft: true
---
```

### `tags`

Add tags for search indexing and categorization.

```yaml
---
title: REST API Endpoints
tags:
  - api
  - rest
  - endpoints
---
```

## Complete Example

```yaml
---
title: User Authentication
description: Complete guide to implementing user authentication with JWT tokens
sidebar_label: Authentication
draft: false
tags:
  - auth
  - jwt
  - security
---

# User Authentication

This guide covers implementing secure user authentication...
```

## Common Mistakes

### Missing Dashes

Frontmatter MUST be enclosed in triple dashes:

```yaml
---
title: Correct
---
```

### Colons in Values

Quote strings containing colons:

```yaml
# Wrong
title: API: Getting Started

# Correct
title: "API: Getting Started"
```

### Title vs H1 Mismatch

Keep frontmatter title and H1 heading consistent:

```yaml
---
title: Installation Guide
---

# Installation Guide
```
