---
title: Blog Styles
description: Blog index grid, post cards, and post body styling
---

# Blog Styles

Blog styles are **theme CSS** that controls the visual appearance of the blog index grid, post cards, and post body. The layout `.astro` components only handle HTML structure, data, and JavaScript.

**Theme file:** `blogs.css`

The layout components define *what* to show (post list, card content, tags, metadata) and *how data is loaded* (content loader). The theme CSS defines *how it all looks* — grid layout, card styling, hover effects, typography, responsive behavior.

---

## Blog Index

The index page shows a grid of post cards with a header and optional pagination.

```
┌──────────────────────────────────────────────────────┐
│              Blog Title                               │
│              Description                              │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Card 1  │  │  Card 2  │  │  Card 3  │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│  ┌──────────┐  ┌──────────┐                          │
│  │  Card 4  │  │  Card 5  │                          │
│  └──────────┘  └──────────┘                          │
│                                                      │
│              [← Prev]  [Next →]                      │
└──────────────────────────────────────────────────────┘
```

### Container

| Selector | Property | Variable |
|----------|----------|----------|
| `.blog-index` | `max-width` | `1200px` |
| | `margin` | `0 auto` |
| | `padding` | `var(--spacing-2xl) var(--spacing-lg)` |

### Header

| Selector | Property | Variable |
|----------|----------|----------|
| `.blog-index__header` | `text-align` | `center` |
| | `margin-bottom` | `--spacing-2xl` |
| `.blog-index__title` | `font-size` | `--font-size-4xl` |
| | `font-weight` | `700` |
| | `color` | `--color-text-primary` |
| `.blog-index__description` | `font-size` | `--font-size-lg` |
| | `color` | `--color-text-secondary` |

### Card Grid

| Selector | Property | Variable |
|----------|----------|----------|
| `.blog-index__grid` | `display` | `grid` |
| | `grid-template-columns` | `repeat(auto-fill, minmax(340px, 1fr))` |
| | `gap` | `--spacing-xl` |

### Pagination

| Selector | Property | Variable |
|----------|----------|----------|
| `.blog-index__pagination` | `display` | `flex` |
| | `justify-content` | `center` |
| | `gap` | `--spacing-md` |
| | `margin-top` | `--spacing-2xl` |
| | `border-top` | `1px solid var(--color-border-default)` |
| `.blog-index__page-link` | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-secondary` |
| | `border` | `1px solid var(--color-border-default)` |
| | `border-radius` | `--border-radius-md` |
| `.blog-index__page-link:hover` | `border-color` | `--color-brand-primary` |
| | `color` | `--color-brand-primary` |

### Empty State

| Selector | Property | Variable |
|----------|----------|----------|
| `.blog-index__empty` | `text-align` | `center` |
| | `padding` | `--spacing-2xl` |
| | `color` | `--color-text-muted` |

### Responsive

| Breakpoint | Behavior |
|------------|----------|
| `<640px` | Grid becomes single column (`grid-template-columns: 1fr`) |

---

## Post Card

Individual blog post cards displayed in the index grid.

```
┌──────────────────────┐
│  ┌──────────────────┐│
│  │   Image (16:9)   ││
│  └──────────────────┘│
│  [tag1] [tag2]       │
│  Post Title          │
│  Description text... │
│  Author · Date       │
└──────────────────────┘
```

### Card Container

| Selector | Property | Variable |
|----------|----------|----------|
| `.post-card` | `background-color` | `--color-bg-primary` |
| | `border` | `1px solid var(--color-border-default)` |
| | `border-radius` | `--border-radius-lg` |
| | `overflow` | `hidden` |
| | `transition` | `border-color var(--transition-fast), box-shadow var(--transition-fast)` |
| `.post-card:hover` | `border-color` | `--color-brand-primary` |
| | `box-shadow` | `--shadow-md` |

### Image

| Selector | Property | Variable |
|----------|----------|----------|
| `.post-card__image-wrapper` | `aspect-ratio` | `16 / 9` |
| | `overflow` | `hidden` |
| | `background-color` | `--color-bg-secondary` |
| `.post-card__image` | `width` / `height` | `100%` |
| | `object-fit` | `cover` |
| | `transition` | `transform var(--transition-normal)` |
| `.post-card:hover .post-card__image` | `transform` | `scale(1.05)` |

### Content

| Selector | Property | Variable |
|----------|----------|----------|
| `.post-card__content` | `padding` | `--spacing-lg` |
| `.post-card__tags` | `display` | `flex` |
| | `gap` | `--spacing-sm` |
| `.post-card__tag` | `font-size` | `--font-size-xs` |
| | `font-weight` | `500` |
| | `color` | `--color-brand-primary` |
| | `background-color` | `--color-bg-secondary` |
| | `padding` | `var(--spacing-xs) var(--spacing-sm)` |
| | `border-radius` | `--border-radius-sm` |
| `.post-card__title` | `font-size` | `--font-size-xl` |
| | `font-weight` | `600` |
| | `color` | `--color-text-primary` |
| `.post-card__description` | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-secondary` |
| | `-webkit-line-clamp` | `2` (truncated to 2 lines) |
| `.post-card__meta` | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-muted` |

---

## Post Body

The full blog post page layout.

```
┌──────────────────────────────────────────────────────┐
│  [← Back to Blog]                                    │
│                                                      │
│  [tag1] [tag2]                                       │
│  Post Title (4xl)                                    │
│  Description text                                    │
│  By Author · January 1, 2024                         │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │              Cover Image                         ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  Content area (.markdown-content)                    │
│  ...                                                 │
│                                                      │
│  ─────────────────────────────────────────────────── │
│  Tagged: #tag1 #tag2                                 │
└──────────────────────────────────────────────────────┘
```

### Container

| Selector | Property | Variable |
|----------|----------|----------|
| `.blog-post` | `max-width` | `800px` |
| | `margin` | `0 auto` |
| | `padding` | `var(--spacing-xl) var(--spacing-lg)` |

### Back Link

| Selector | Property | Variable |
|----------|----------|----------|
| `.blog-post__back` | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-secondary` |
| | `margin-bottom` | `--spacing-xl` |
| | `transition` | `color var(--transition-fast)` |
| `.blog-post__back:hover` | `color` | `--color-brand-primary` |
| `.blog-post__back svg` | `width` / `height` | `1rem` |

### Header

| Selector | Property | Variable |
|----------|----------|----------|
| `.blog-post__tags` | `display` | `flex` |
| | `gap` | `--spacing-sm` |
| `.blog-post__tag` | `font-size` | `--font-size-xs` |
| | `color` | `--color-brand-primary` |
| | `background-color` | `--color-bg-secondary` |
| | `border-radius` | `--border-radius-sm` |
| `.blog-post__title` | `font-size` | `--font-size-4xl` |
| | `font-weight` | `700` |
| | `color` | `--color-text-primary` |
| `.blog-post__description` | `font-size` | `--font-size-xl` |
| | `color` | `--color-text-secondary` |
| `.blog-post__meta` | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-muted` |

### Cover Image

| Selector | Property | Variable |
|----------|----------|----------|
| `.blog-post__image` | `width` | `100%` |
| | `border-radius` | `--border-radius-lg` |
| | `margin-bottom` | `--spacing-xl` |

### Content

| Selector | Property | Variable |
|----------|----------|----------|
| `.blog-post__content` | `line-height` | `1.8` |
| `.blog-post__content h2` | `font-size` | `--font-size-2xl` |
| | `font-weight` | `600` |
| `.blog-post__content h3` | `font-size` | `--font-size-xl` |
| | `font-weight` | `600` |
| `.blog-post__content blockquote` | `border-left` | `4px solid var(--color-brand-primary)` |
| | `background-color` | `--color-bg-secondary` |

### Footer

| Selector | Property | Variable |
|----------|----------|----------|
| `.blog-post__footer` | `margin-top` | `--spacing-2xl` |
| | `padding-top` | `--spacing-xl` |
| | `border-top` | `1px solid var(--color-border-default)` |
| `.blog-post__footer-label` | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-muted` |
| `.blog-post__footer-tag` | `font-size` | `--font-size-sm` |
| | `color` | `--color-brand-primary` |

### Responsive

| Breakpoint | Behavior |
|------------|----------|
| `<640px` | Post title downsizes to `--font-size-3xl` |
