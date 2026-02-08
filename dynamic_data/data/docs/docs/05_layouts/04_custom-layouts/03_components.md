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

Components contain only `.astro` files with HTML structure and CSS class references. All styling is provided by the theme's `custom.css` file in `src/styles/`, which is injected globally via `BaseLayout`.

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

The Hero component uses CSS classes like `.hero`, `.hero__title`, `.hero__subtitle`, `.hero__actions`, and `.hero__cta`. All styling for these classes is defined in the theme's `custom.css` file in `src/styles/`, not in the component itself. The theme provides styles for layout, typography, colors, and button variants using CSS variables.

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

The Features component uses CSS classes like `.features`, `.features__grid`, `.feature-card`, `.feature-card__icon`, `.feature-card__title`, and `.feature-card__description`. All styling for these classes is defined in the theme's `custom.css` file in `src/styles/`, not in the component itself.

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

The Content component uses CSS classes like `.content-section`, `.content-section__title`, and `.content-section__body`. All styling for these classes is defined in the theme's `custom.css` file in `src/styles/`, not in the component itself.

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
```

If your custom component introduces new CSS classes (like `.testimonials`, `.testimonials__grid`, `.testimonial`), add the corresponding styles to the theme's `custom.css` file in `src/styles/`. Do not add `<style>` blocks or CSS files in the component directory.

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

Custom components do not have their own CSS files or style imports. All styling is provided by the theme's `custom.css` file in `src/styles/`, which is injected globally via `BaseLayout`. When creating new components, use CSS classes that are defined in the theme. If you need new styles, add them to the theme CSS files rather than to the layout or component directories.
