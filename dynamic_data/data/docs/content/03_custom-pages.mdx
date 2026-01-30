---
title: Custom Pages
description: Create custom pages with YAML data and Astro layouts
---

# Custom Pages

Custom pages allow unique designs using YAML data files and custom layouts.

## How Custom Pages Work

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   YAML Data     │────▶│   Layout        │────▶│   Rendered      │
│   (content)     │     │   (structure)   │     │   Page          │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Data file** (YAML) defines page content
2. **Layout** (Astro) defines page structure
3. **Config** connects them with a URL

## Example: Home Page

### 1. Create Data File

`data/pages/home.yaml`:

```yaml
hero:
  title: "Build Beautiful Documentation"
  subtitle: "A modern documentation template powered by Astro"
  cta:
    label: "Get Started"
    href: "/docs"
  secondaryCta:
    label: "View on GitHub"
    href: "https://github.com/example/repo"

features:
  - title: "Fast by Default"
    description: "Built on Astro for optimal performance"
    icon: "⚡"

  - title: "MDX Support"
    description: "Write documentation with components"
    icon: "📝"

  - title: "Customizable"
    description: "Themes, layouts, and components"
    icon: "🎨"

  - title: "Developer Friendly"
    description: "Hot reload, TypeScript, great DX"
    icon: "🛠️"
```

### 2. Create or Use Layout

The `@custom/home` layout reads this data:

```astro
---
// src/layouts/custom/styles/home/Layout.astro
import Hero from '../../components/hero/default/Hero.astro';
import Features from '../../components/features/default/Features.astro';
import { loadFile } from '@loaders/data';

interface Props {
  dataPath: string;
}

const { dataPath } = Astro.props;
const content = await loadFile(dataPath);
const { hero, features } = content.data;
---

<div class="home-page">
  {hero && <Hero {...hero} />}
  {features && <Features features={features} />}
</div>

<style>
  .home-page {
    min-height: 100vh;
  }
</style>
```

### 3. Configure in site.yaml

```yaml
pages:
  home:
    base_url: "/"
    type: custom
    layout: "@custom/home"
    data: "@data/pages/home.yaml"
```

## Example: About Page

### Data File

`data/pages/about.yaml`:

```yaml
title: "About Us"
subtitle: "Learn more about our team and mission"

content: |
  We are a team of developers passionate about creating
  great documentation experiences.

  ## Our Mission

  To make documentation easy to write, maintain, and read.

  ## Our Values

  - **Simplicity** - Keep things simple
  - **Quality** - Do it right
  - **Community** - Build together

team:
  - name: "Alice Chen"
    role: "Founder & CEO"
    image: "/images/team/alice.jpg"

  - name: "Bob Smith"
    role: "Lead Engineer"
    image: "/images/team/bob.jpg"

  - name: "Carol Davis"
    role: "Designer"
    image: "/images/team/carol.jpg"
```

### Configuration

```yaml
pages:
  about:
    base_url: "/about"
    type: custom
    layout: "@custom/info"
    data: "@data/pages/about.yaml"
```

## Creating Custom Layouts

### Step 1: Create Layout Folder

```bash
mkdir -p src/layouts/custom/styles/my_page
```

### Step 2: Create Layout.astro

```astro
---
// src/layouts/custom/styles/my_page/Layout.astro
import { loadFile } from '@loaders/data';
import { marked } from 'marked';
import './layout.css';

interface Props {
  dataPath: string;
}

const { dataPath } = Astro.props;
const content = await loadFile(dataPath);
const { title, subtitle, sections } = content.data;
---

<div class="my-page">
  <header class="page-header">
    <h1>{title}</h1>
    {subtitle && <p class="subtitle">{subtitle}</p>}
  </header>

  <main class="page-content">
    {sections?.map((section) => (
      <section class="content-section">
        <h2>{section.heading}</h2>
        <div set:html={marked(section.content)} />
      </section>
    ))}
  </main>
</div>
```

### Step 3: Add Styles

```css
/* layout.css */
.my-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 4rem 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 4rem;
}

.page-header h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
}

.content-section {
  margin-bottom: 3rem;
}

.content-section h2 {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}
```

### Step 4: Use in Config

```yaml
pages:
  my_page:
    base_url: "/my-page"
    type: custom
    layout: "@custom/my_page"
    data: "@data/pages/my-page.yaml"
```

## Data Structure Best Practices

### Keep Data Flat

```yaml
# Good - clear, flat structure
hero:
  title: "Welcome"
  subtitle: "Get started today"

features:
  - title: "Feature 1"

# Avoid - deeply nested
page:
  sections:
    header:
      content:
        hero:
          title: "Welcome"
```

### Use Arrays for Repeating Content

```yaml
# Good - easy to iterate
features:
  - title: "Fast"
    description: "Lightning quick"
  - title: "Simple"
    description: "Easy to use"

# Avoid - harder to work with
feature1:
  title: "Fast"
feature2:
  title: "Simple"
```

### Support Markdown in Text

```yaml
content: |
  This is **bold** and this is *italic*.

  ## A Heading

  - List item 1
  - List item 2

  [A link](https://example.com)
```

Render with:

```astro
<div set:html={marked(data.content)} />
```

### Use Semantic Keys

```yaml
# Good - clear intent
cta:
  label: "Get Started"
  href: "/docs"

# Avoid - unclear
button:
  text: "Get Started"
  url: "/docs"
```

## Available Custom Layouts

| Layout | Description | Expected Data |
|--------|-------------|---------------|
| `@custom/home` | Landing page with hero + features | `hero`, `features` |
| `@custom/info` | Simple content page | `title`, `content` |

## Tips

1. **Start with existing layouts** - Copy and modify
2. **Keep data simple** - Only include what you need
3. **Use components** - Build from existing pieces
4. **Test responsively** - Check all screen sizes
5. **Validate YAML** - Use a linter to catch errors
