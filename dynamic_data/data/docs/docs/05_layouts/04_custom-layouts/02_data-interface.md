---
title: Data Interface
description: What data custom layouts receive and how to define custom schemas
---

# Data Interface

Custom layouts receive minimal props from the route handler and load their own data. This gives you complete control over the data schema.

## What Layouts Receive

Unlike docs and blog post layouts, custom layouts receive **only a path** — no pre-rendered content:

| Received | Type | Description |
|----------|------|-------------|
| `dataPath` | String | Absolute path to YAML file |
| `baseUrl` | String | Page URL (for context) |

```
Route Handler ([...slug].astro)
─────────────────────────────────
1. Reads site.yaml config
2. Gets dataPath from config
3. Passes to layout:
   • dataPath: "/path/to/home.yaml"  ← Just a path
   • baseUrl: "/"
            │
            ▼
Layout (home)
─────────────
• Receives: dataPath (not content!)
• Must: loadFile(dataPath) to get YAML data
• Must: Render everything from scratch
```

**Key point:** Custom layouts receive NO pre-processed content. The layout is fully responsible for loading data and rendering.

## Props Interface

All custom layouts receive just two props:

```typescript
interface CustomLayoutProps {
  dataPath: string;    // Absolute path to YAML file
  baseUrl: string;     // Page URL (for context)
}
```

That's it! The layout is responsible for:
1. Loading the YAML file
2. Defining the expected data shape
3. Handling missing or invalid data

## Loading Data

Use the `loadFile` helper to load YAML content:

```typescript
import { loadFile } from '@loaders/data';

const { dataPath } = Astro.props;

const fileContent = await loadFile(dataPath);
const pageData = fileContent.data;
```

### Return Structure

`loadFile` returns:

```typescript
interface LoadedFile {
  data: Record<string, unknown>;  // Parsed YAML content
  content?: string;               // If has markdown body
  filePath: string;               // Absolute path
}
```

## Defining Data Schemas

### TypeScript Interface

Define what your layout expects:

```typescript
// home layout
interface HeroData {
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
}

interface FeatureData {
  icon?: string;
  title: string;
  description: string;
}

interface HomePageData {
  hero?: HeroData;
  features?: FeatureData[];
}
```

### Type Casting

Cast the loaded data to your interface:

```typescript
const { dataPath } = Astro.props;
const content = await loadFile(dataPath);
const pageData = content.data as HomePageData;
```

## Example: home Layout

### YAML File (home.yaml)

```yaml
hero:
  title: "Build Beautiful Docs"
  subtitle: "A modern documentation framework"
  cta:
    label: "Get Started"
    href: "/docs"
  secondaryCta:
    label: "GitHub"
    href: "https://github.com/..."

features:
  - icon: "🚀"
    title: "Fast"
    description: "Lightning quick builds"
  - icon: "🧩"
    title: "Modular"
    description: "Pick your layout"
  - icon: "⚡"
    title: "Simple"
    description: "Easy configuration"
```

### Layout Component

```astro
---
import Hero from '../../components/hero/default/Hero.astro';
import Features from '../../components/features/default/Features.astro';
import { loadFile } from '@loaders/data';

import '../../components/hero/default/styles.css';
import '../../components/features/default/styles.css';

interface HeroData {
  title: string;
  subtitle?: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

interface FeatureData {
  icon?: string;
  title: string;
  description: string;
}

interface Props {
  dataPath: string;
}

const { dataPath } = Astro.props;

let pageData: { hero?: HeroData; features?: FeatureData[] } = {};

try {
  const content = await loadFile(dataPath);
  pageData = content.data as typeof pageData;
} catch (error) {
  console.error('Error loading home page data:', error);
}

const hero = pageData.hero;
const features = pageData.features || [];
---

<div class="home">
  {hero && <Hero hero={hero} />}
  {features.length > 0 && <Features features={features} />}
</div>
```

## Example: info Layout

### YAML File (about.yaml)

```yaml
title: "About Us"
description: |
  We are a team of developers passionate about creating
  great documentation experiences.

  Our mission is to make documentation easy and beautiful.
```

### Layout Component

```astro
---
import Content from '../../components/content/default/Content.astro';
import { loadFile } from '@loaders/data';

import '../../components/content/default/styles.css';

interface Props {
  dataPath: string;
}

const { dataPath } = Astro.props;

let pageData: { title?: string; description?: string } = {};

try {
  const content = await loadFile(dataPath);
  pageData = content.data as typeof pageData;
} catch (error) {
  console.error('Error loading info page data:', error);
}

const title = pageData.title || 'Page';
const description = pageData.description;
---

<Content title={title} description={description}>
  <slot />
</Content>
```

## Mixed Content (YAML + Markdown)

YAML files can include markdown content:

### YAML with Body

```yaml
title: "Privacy Policy"
lastUpdated: "2024-01-15"
---
# Privacy Policy

We take your privacy seriously...

## Data Collection

We collect the following data:
- Usage analytics
- Error reports
```

### Accessing Markdown Content

```typescript
const content = await loadFile(dataPath);

const pageData = content.data;   // { title, lastUpdated }
const markdownBody = content.content;  // "# Privacy Policy..."
```

### Rendering Markdown

If you need to render the markdown body:

```typescript
import { marked } from 'marked';

const htmlContent = marked.parse(content.content || '');
```

```astro
<div class="content">
  <Fragment set:html={htmlContent} />
</div>
```

## Data Validation

### Optional Validation

Add runtime validation for safety:

```typescript
function validateHomeData(data: unknown): HomePageData {
  if (!data || typeof data !== 'object') {
    return { hero: undefined, features: [] };
  }

  const obj = data as Record<string, unknown>;

  return {
    hero: obj.hero as HeroData | undefined,
    features: Array.isArray(obj.features) ? obj.features : [],
  };
}

const pageData = validateHomeData(content.data);
```

### Default Values

Always provide fallbacks:

```typescript
const hero = pageData.hero;
const features = pageData.features || [];
const title = pageData.title || 'Untitled Page';
```

## Complex Data Structures

### Nested Objects

```yaml
# pricing.yaml
plans:
  - name: "Starter"
    price: 0
    features:
      - "5 projects"
      - "Basic support"
    cta:
      label: "Start Free"
      href: "/signup"

  - name: "Pro"
    price: 29
    features:
      - "Unlimited projects"
      - "Priority support"
      - "Custom domain"
    cta:
      label: "Get Pro"
      href: "/signup?plan=pro"
    popular: true
```

### TypeScript Interface

```typescript
interface Plan {
  name: string;
  price: number;
  features: string[];
  cta: {
    label: string;
    href: string;
  };
  popular?: boolean;
}

interface PricingPageData {
  plans: Plan[];
}
```

## Error Handling

### Graceful Degradation

```astro
---
let pageData = {};
let loadError = false;

try {
  const content = await loadFile(dataPath);
  pageData = content.data;
} catch (error) {
  console.error('Failed to load page data:', error);
  loadError = true;
}
---

{loadError ? (
  <div class="error">
    <p>Failed to load page content.</p>
  </div>
) : (
  <div class="home">
    {/* Normal content */}
  </div>
)}
```

### Missing Data Sections

```astro
{hero ? (
  <Hero hero={hero} />
) : (
  <div class="hero-placeholder">
    <h1>Welcome</h1>
  </div>
)}
```
