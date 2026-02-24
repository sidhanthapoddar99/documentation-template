---
title: Components
description: Reusable components for custom layouts
---

# Custom Components

Custom layouts compose from section components located in `src/layouts/custom/components/`. These components are designed for landing pages and marketing content.

## Component Directory

```
src/layouts/custom/components/
├── hero/
│   └── default/
│       └── Hero.astro         # Hero section
│
├── features/
│   └── default/
│       └── Features.astro     # Feature grid
│
└── content/
    └── default/
        └── Content.astro      # Simple content wrapper
```

Components are `.astro` files with HTML structure and scoped `<style>` blocks. Styles use theme CSS variables for consistency.

## Hero

The Hero component renders a prominent header section with title, subtitle, and call-to-action buttons.

**File:** `src/layouts/custom/components/hero/default/Hero.astro`

### Props

```typescript
interface Props {
  hero: {
    title: string;
    subtitle?: string;
    cta?: {
      label: string;
      href: string;
    };
    secondaryCta?: {
      label: string;
      href: string;
    };
  };
}
```

### Usage

```astro
---
import Hero from '../../components/hero/default/Hero.astro';

const hero = {
  title: "Build Beautiful Docs",
  subtitle: "A modern documentation framework",
  cta: {
    label: "Get Started",
    href: "/docs"
  }
};
---

<Hero hero={hero} />
```

### Structure

```astro
---
interface Props {
  hero: {
    title: string;
    subtitle?: string;
    cta?: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
  };
}

const { hero } = Astro.props;
---

<section class="hero">
  <div class="hero__content">
    <h1 class="hero__title">{hero.title}</h1>

    {hero.subtitle && (
      <p class="hero__subtitle">{hero.subtitle}</p>
    )}

    <div class="hero__actions">
      {hero.cta && (
        <a href={hero.cta.href} class="hero__cta hero__cta--primary">
          {hero.cta.label}
        </a>
      )}

      {hero.secondaryCta && (
        <a href={hero.secondaryCta.href} class="hero__cta hero__cta--secondary">
          {hero.secondaryCta.label}
        </a>
      )}
    </div>
  </div>
</section>
```

### Styling

The Hero component defines its own styles using a scoped `<style>` block at the end of the component. Styles use theme CSS variables for consistency:

```astro
<style>
.hero {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl) var(--spacing-lg);
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
}

.hero__title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
}

/* ... additional hero styles ... */
</style>
```

## Features

The Features component renders a grid of feature cards.

**File:** `src/layouts/custom/components/features/default/Features.astro`

### Props

```typescript
interface Props {
  features: Array<{
    icon?: string;
    title: string;
    description: string;
  }>;
}
```

### Usage

```astro
---
import Features from '../../components/features/default/Features.astro';

const features = [
  {
    icon: "🚀",
    title: "Fast",
    description: "Built on Astro for lightning-fast builds"
  },
  {
    icon: "🧩",
    title: "Modular",
    description: "Pick and choose layouts"
  },
  {
    icon: "⚡",
    title: "Simple",
    description: "YAML configuration"
  }
];
---

<Features features={features} />
```

### Structure

```astro
---
interface Props {
  features: Array<{
    icon?: string;
    title: string;
    description: string;
  }>;
}

const { features } = Astro.props;
---

<section class="features">
  <div class="features__grid">
    {features.map(feature => (
      <div class="feature-card">
        {feature.icon && (
          <span class="feature-card__icon">{feature.icon}</span>
        )}
        <h3 class="feature-card__title">{feature.title}</h3>
        <p class="feature-card__description">{feature.description}</p>
      </div>
    ))}
  </div>
</section>
```

### Styling

The Features component defines its own styles using a scoped `<style>` block. Styles use theme CSS variables:

```astro
<style>
.features {
  padding: var(--spacing-3xl) var(--spacing-lg);
  background-color: var(--color-bg-primary);
}

.features__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-xl);
}

.feature-card {
  padding: var(--spacing-xl);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
}

/* ... additional feature styles ... */
</style>
```

## Content

The Content component is a simple wrapper for text content.

**File:** `src/layouts/custom/components/content/default/Content.astro`

### Props

```typescript
interface Props {
  title?: string;
  description?: string;
}
```

### Usage

```astro
---
import Content from '../../components/content/default/Content.astro';
---

<Content title="About Us" description="Our story and mission">
  <p>Additional content can go here via slot.</p>
</Content>
```

### Structure

```astro
---
interface Props {
  title?: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<section class="content-section">
  {title && <h1 class="content-section__title">{title}</h1>}

  {description && (
    <div class="content-section__body">
      <p>{description}</p>
    </div>
  )}

  <slot />
</section>
```

### Styling

The Content component defines its own styles using a scoped `<style>` block:

```astro
<style>
.content-section {
  padding: var(--spacing-2xl) var(--spacing-lg);
  max-width: 800px;
  margin: 0 auto;
}

.content-section__title {
  font-size: var(--font-size-4xl);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
}

.content-section__body {
  color: var(--color-text-secondary);
  line-height: 1.8;
}
</style>
```

## Creating Custom Components

### Example: Testimonials Component

```bash
mkdir -p src/layouts/custom/components/testimonials/default/
```

```astro
---
// testimonials/default/Testimonials.astro
interface Props {
  testimonials: Array<{
    quote: string;
    author: string;
    role?: string;
    avatar?: string;
  }>;
}

const { testimonials } = Astro.props;
---

<section class="testimonials">
  <h2>What people are saying</h2>

  <div class="testimonials__grid">
    {testimonials.map(t => (
      <blockquote class="testimonial">
        <p class="testimonial__quote">"{t.quote}"</p>
        <footer class="testimonial__author">
          {t.avatar && <img src={t.avatar} alt="" />}
          <div>
            <cite>{t.author}</cite>
            {t.role && <span>{t.role}</span>}
          </div>
        </footer>
      </blockquote>
    ))}
  </div>
</section>

<style>
.testimonials {
  padding: var(--spacing-3xl) var(--spacing-lg);
  background: var(--color-bg-primary);
}

.testimonials__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
  margin-top: var(--spacing-2xl);
}

.testimonial {
  background: var(--color-bg-secondary);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-light);
}

.testimonial__quote {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.testimonial__author {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-secondary);
}
</style>
```

### Using in Layout

```astro
---
// home/Layout.astro
import Hero from '../../components/hero/default/Hero.astro';
import Features from '../../components/features/default/Features.astro';
import Testimonials from '../../components/testimonials/default/Testimonials.astro';

// ... load data ...
---

<div class="home">
  {hero && <Hero hero={hero} />}
  {features && <Features features={features} />}
  {testimonials && <Testimonials testimonials={testimonials} />}
</div>
```

## Component Variants

Create variants for different visual styles:

```
components/hero/
├── default/          # Standard centered hero
├── split/            # Image on one side
└── video/            # Background video
```

Use in layouts:

```astro
---
// Use split variant
import Hero from '../../components/hero/split/Hero.astro';
---
```

## Styling

Custom components define their styles using scoped `<style>` blocks within each `.astro` file. When creating new components:

1. Add a `<style>` block at the end of the component
2. Use theme CSS variables for consistency (`var(--color-*)`, `var(--spacing-*)`, etc.)
3. Define component-specific classes and layouts
4. Keep styles scoped to avoid global CSS conflicts

This approach keeps each component self-contained while maintaining visual consistency through shared theme variables.
