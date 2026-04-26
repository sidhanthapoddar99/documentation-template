---
title: Creating Custom Layouts
description: Step-by-step guide to creating new custom layouts
---

# Creating Custom Layouts

This guide walks through creating a new custom layout from scratch. We'll build a pricing page layout as an example.

## Step 1: Create the Layout Folder

```bash
mkdir -p src/layouts/custom/styles/pricing/
```

## Step 2: Create the Layout Component

**File:** `src/layouts/custom/styles/pricing/Layout.astro`

```astro
---
/**
 * Pricing Layout - Pricing page with plans
 */
import { loadFile } from '@loaders/data';

// Define data interface
interface Plan {
  name: string;
  price: number | string;
  period?: string;
  description?: string;
  features: string[];
  cta: {
    label: string;
    href: string;
  };
  popular?: boolean;
}

interface PricingData {
  title?: string;
  subtitle?: string;
  plans: Plan[];
}

interface Props {
  dataPath: string;
}

const { dataPath } = Astro.props;

// Load page data
let pageData: PricingData = { plans: [] };

try {
  const content = await loadFile(dataPath);
  pageData = content.data as PricingData;
} catch (error) {
  console.error('Error loading pricing data:', error);
}

const { title = 'Pricing', subtitle, plans } = pageData;
---

<div class="pricing-page">
  <header class="pricing-header">
    <h1>{title}</h1>
    {subtitle && <p>{subtitle}</p>}
  </header>

  <div class="pricing-grid">
    {plans.map(plan => (
      <div class={`pricing-card ${plan.popular ? 'pricing-card--popular' : ''}`}>
        {plan.popular && <span class="popular-badge">Most Popular</span>}

        <h2 class="pricing-card__name">{plan.name}</h2>

        <div class="pricing-card__price">
          {typeof plan.price === 'number' ? (
            <>
              <span class="currency">$</span>
              <span class="amount">{plan.price}</span>
              <span class="period">/{plan.period || 'mo'}</span>
            </>
          ) : (
            <span class="custom">{plan.price}</span>
          )}
        </div>

        {plan.description && (
          <p class="pricing-card__description">{plan.description}</p>
        )}

        <ul class="pricing-card__features">
          {plan.features.map(feature => (
            <li>
              <span class="check">✓</span>
              {feature}
            </li>
          ))}
        </ul>

        <a href={plan.cta.href} class="pricing-card__cta">
          {plan.cta.label}
        </a>
      </div>
    ))}
  </div>
</div>
```

## Step 3: Add Styles to the Layout

Add a scoped `<style>` block to your layout component. Use theme CSS variables for consistency:

```astro
<!-- At the end of Layout.astro -->
<style>
.pricing-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-3xl) var(--spacing-lg);
}

.pricing-header {
  text-align: center;
  margin-bottom: var(--spacing-3xl);
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-xl);
  align-items: start;
}

.pricing-card {
  position: relative;
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--color-border-default);
}

/* ... additional pricing styles ... */
</style>
```

The `<style>` block is scoped to the component, keeping styles modular and avoiding global CSS pollution.

## Step 4: Create the Data File

**File:** `dynamic_data/data/pages/pricing.yaml`

```yaml
title: "Simple, Transparent Pricing"
subtitle: "Choose the plan that's right for you"

plans:
  - name: "Starter"
    price: 0
    period: "forever"
    description: "Perfect for trying out"
    features:
      - "Up to 3 projects"
      - "Basic analytics"
      - "Community support"
      - "1 GB storage"
    cta:
      label: "Get Started Free"
      href: "/signup?plan=starter"

  - name: "Pro"
    price: 29
    period: "mo"
    description: "For growing teams"
    popular: true
    features:
      - "Unlimited projects"
      - "Advanced analytics"
      - "Priority support"
      - "10 GB storage"
      - "Custom domains"
      - "Team collaboration"
    cta:
      label: "Start Free Trial"
      href: "/signup?plan=pro"

  - name: "Enterprise"
    price: "Custom"
    description: "For large organizations"
    features:
      - "Everything in Pro"
      - "Unlimited storage"
      - "SSO & SAML"
      - "Dedicated support"
      - "SLA guarantee"
      - "Custom integrations"
    cta:
      label: "Contact Sales"
      href: "/contact?plan=enterprise"
```

## Step 5: Configure in site.yaml

**File:** `dynamic_data/config/site.yaml`

```yaml
pages:
  # ... other pages ...

  pricing:
    base_url: "/pricing"
    type: custom
    layout: "@custom/pricing"
    data: "@data/pages/pricing.yaml"
```

## Step 6: Test

```bash
npm run build
```

Visit `/pricing` to see your new layout.

## Extracting Components

As your layout grows, extract reusable parts into components:

### Create Component

```bash
mkdir -p src/layouts/custom/components/pricing-card/default/
```

**File:** `pricing-card/default/PricingCard.astro`

```astro
---
interface Props {
  name: string;
  price: number | string;
  period?: string;
  description?: string;
  features: string[];
  cta: { label: string; href: string };
  popular?: boolean;
}

const { name, price, period, description, features, cta, popular } = Astro.props;
---

<div class={`pricing-card ${popular ? 'pricing-card--popular' : ''}`}>
  {popular && <span class="popular-badge">Most Popular</span>}
  <h2>{name}</h2>
  <!-- ... rest of card ... -->
</div>
```

### Use in Layout

```astro
---
import PricingCard from '../../components/pricing-card/default/PricingCard.astro';
---

<div class="pricing-grid">
  {plans.map(plan => (
    <PricingCard {...plan} />
  ))}
</div>
```

## Adding Sections

Compose multiple sections in your layout:

```astro
---
import Hero from '../../components/hero/default/Hero.astro';
import PricingGrid from './PricingGrid.astro';
import FAQ from '../../components/faq/default/FAQ.astro';

// ... load data ...
---

<div class="pricing-page">
  {hero && <Hero hero={hero} />}

  <PricingGrid plans={plans} />

  {faq && <FAQ items={faq} />}
</div>
```

## Checklist

Before shipping your custom layout:

- [ ] Layout receives `dataPath` and loads data
- [ ] TypeScript interfaces defined
- [ ] Error handling for missing data
- [ ] Empty states for missing sections
- [ ] Responsive design (use `@media` queries in `<style>` block)
- [ ] Dark mode support (use theme color variables)
- [ ] Accessible markup
- [ ] Styles added to component `<style>` block using theme variables
- [ ] Data file created
- [ ] site.yaml configured
- [ ] Build passes
