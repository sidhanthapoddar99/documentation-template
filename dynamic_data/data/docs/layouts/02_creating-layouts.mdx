---
title: Creating Layouts
description: Build custom layouts for your site
---

# Creating Layouts

Create custom layouts to achieve unique designs while reusing existing components.

## Creating a Docs Layout

### Step 1: Create the Style Folder

```bash
mkdir -p src/layouts/docs/styles/my_style
```

### Step 2: Create Layout.astro

```astro
---
// src/layouts/docs/styles/my_style/Layout.astro
import Body from '../../components/body/default/Body.astro';
import Sidebar from '../../components/sidebar/default/Sidebar.astro';
import Outline from '../../components/outline/default/Outline.astro';
import Pagination from '../../components/common/Pagination.astro';
import './layout.css';

interface Props {
  content: any;
  frontmatter: any;
  tree: any;
  currentSlug: string;
  headings: any[];
  pagination: any;
}

const { content, frontmatter, tree, currentSlug, headings, pagination } = Astro.props;
---

<div class="my-doc-layout">
  <aside class="my-sidebar">
    <Sidebar tree={tree} currentSlug={currentSlug} />
  </aside>

  <main class="my-content">
    <article>
      <h1>{frontmatter.title}</h1>
      {frontmatter.description && (
        <p class="description">{frontmatter.description}</p>
      )}
      <Body content={content} />
    </article>
    <Pagination pagination={pagination} />
  </main>

  <aside class="my-outline">
    <Outline headings={headings} />
  </aside>
</div>
```

### Step 3: Add Styles

```css
/* src/layouts/docs/styles/my_style/layout.css */
.my-doc-layout {
  display: grid;
  grid-template-columns: 280px 1fr 240px;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.my-sidebar {
  position: sticky;
  top: 80px;
  height: fit-content;
}

.my-content {
  min-width: 0;
}

.my-content h1 {
  margin-bottom: 0.5rem;
}

.my-content .description {
  color: var(--color-text-secondary);
  font-size: 1.125rem;
  margin-bottom: 2rem;
}

.my-outline {
  position: sticky;
  top: 80px;
  height: fit-content;
}

@media (max-width: 1200px) {
  .my-doc-layout {
    grid-template-columns: 260px 1fr;
  }
  .my-outline {
    display: none;
  }
}

@media (max-width: 768px) {
  .my-doc-layout {
    grid-template-columns: 1fr;
  }
  .my-sidebar {
    display: none;
  }
}
```

### Step 4: Use the Layout

```yaml
# site.yaml
pages:
  docs:
    layout: "@docs/my_style"
```

## Creating a Custom Component

To create a variant of an existing component:

### Example: Minimal Sidebar

```bash
mkdir -p src/layouts/docs/components/sidebar/minimal
```

```astro
---
// sidebar/minimal/Sidebar.astro
import './styles.css';

interface Props {
  tree: any;
  currentSlug: string;
}

const { tree, currentSlug } = Astro.props;

function isActive(slug: string) {
  return currentSlug === slug;
}
---

<nav class="minimal-sidebar">
  {tree.map((section) => (
    <div class="section">
      <span class="section-label">{section.label}</span>
      <ul>
        {section.children?.map((item) => (
          <li>
            <a
              href={`/docs/${item.slug}`}
              class:list={['link', { active: isActive(item.slug) }]}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  ))}
</nav>
```

```css
/* sidebar/minimal/styles.css */
.minimal-sidebar {
  font-size: 0.875rem;
}

.section {
  margin-bottom: 1.5rem;
}

.section-label {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
}

.section ul {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
}

.link {
  display: block;
  padding: 0.375rem 0;
  color: var(--color-text-secondary);
  text-decoration: none;
}

.link:hover {
  color: var(--color-text-primary);
}

.link.active {
  color: var(--color-brand-primary);
  font-weight: 500;
}
```

Then use it in a layout:

```astro
import Sidebar from '../../components/sidebar/minimal/Sidebar.astro';
```

## Creating a Blog Layout

### Index Layout

```astro
---
// src/layouts/blogs/styles/my_blog/IndexLayout.astro
import PostCard from '../../components/cards/default/PostCard.astro';
import './index.css';

interface Props {
  posts: any[];
}

const { posts } = Astro.props;
---

<div class="blog-index">
  <header>
    <h1>Blog</h1>
    <p>Latest articles and updates</p>
  </header>

  <div class="posts-grid">
    {posts.map((post) => (
      <PostCard post={post} />
    ))}
  </div>
</div>
```

### Post Layout

```astro
---
// src/layouts/blogs/styles/my_blog/PostLayout.astro
import './post.css';

interface Props {
  content: any;
  frontmatter: any;
}

const { content, frontmatter } = Astro.props;
const Content = content;
---

<article class="blog-post">
  <header>
    <time datetime={frontmatter.date}>{frontmatter.date}</time>
    <h1>{frontmatter.title}</h1>
    {frontmatter.description && <p class="lead">{frontmatter.description}</p>}
  </header>

  <div class="content">
    <Content />
  </div>

  <footer>
    {frontmatter.tags && (
      <div class="tags">
        {frontmatter.tags.map((tag) => (
          <span class="tag">{tag}</span>
        ))}
      </div>
    )}
  </footer>
</article>
```

## Creating a Custom Page Layout

```astro
---
// src/layouts/custom/styles/landing/Layout.astro
import Hero from '../../components/hero/default/Hero.astro';
import Features from '../../components/features/default/Features.astro';
import './layout.css';

interface Props {
  data: {
    hero: any;
    features: any[];
  };
}

const { data } = Astro.props;
---

<div class="landing-page">
  {data.hero && <Hero {...data.hero} />}
  {data.features && <Features features={data.features} />}
</div>
```

With data file:

```yaml
# data/pages/landing.yaml
hero:
  title: "Build Amazing Things"
  subtitle: "A powerful platform for developers"
  cta:
    label: "Get Started"
    href: "/docs"

features:
  - title: "Fast"
    description: "Optimized for performance"
    icon: "⚡"
  - title: "Flexible"
    description: "Customize everything"
    icon: "🎨"
```

## Best Practices

1. **Reuse components** - Don't duplicate, import existing components
2. **CSS isolation** - Keep styles scoped to your layout
3. **Responsive design** - Test on all screen sizes
4. **Use CSS variables** - For consistent theming
5. **Follow naming conventions** - Use clear, descriptive names
