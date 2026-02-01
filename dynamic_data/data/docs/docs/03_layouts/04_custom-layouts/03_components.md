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
│       ├── Hero.astro         # Hero section
│       └── styles.css
│
├── features/
│   └── default/
│       ├── Features.astro     # Feature grid
│       └── styles.css
│
└── content/
    └── default/
        ├── Content.astro      # Simple content wrapper
        └── styles.css
```

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

```css
.hero {
  padding: 6rem 2rem;
  text-align: center;
  background: linear-gradient(
    to bottom,
    var(--color-bg-secondary),
    var(--color-bg-primary)
  );
}

.hero__title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.hero__subtitle {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto 2rem;
}

.hero__actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.hero__cta {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
}

.hero__cta--primary {
  background: var(--color-primary);
  color: white;
}

.hero__cta--secondary {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}
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

```css
.features {
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.features__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  padding: 2rem;
  background: var(--color-bg-secondary);
  border-radius: 12px;
  text-align: center;
}

.feature-card__icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 1rem;
}

.feature-card__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.feature-card__description {
  color: var(--color-text-secondary);
  line-height: 1.6;
}
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

```css
.content-section {
  max-width: 720px;
  margin: 0 auto;
  padding: 4rem 2rem;
}

.content-section__title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.content-section__body {
  font-size: 1.125rem;
  line-height: 1.75;
  color: var(--color-text-secondary);
}

.content-section__body p {
  margin-bottom: 1.5rem;
}
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
    padding: 4rem 2rem;
    background: var(--color-bg-secondary);
  }

  .testimonials__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .testimonial {
    background: var(--color-bg-primary);
    padding: 2rem;
    border-radius: 12px;
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

## Style Imports

Import component styles in your layout:

```astro
---
import Hero from '../../components/hero/default/Hero.astro';
import Features from '../../components/features/default/Features.astro';

// Import styles
import '../../components/hero/default/styles.css';
import '../../components/features/default/styles.css';
---
```

Or create a central import file:

```css
/* home/styles.css */
@import '../../components/hero/default/styles.css';
@import '../../components/features/default/styles.css';
```

```astro
---
import './styles.css';
---
```
