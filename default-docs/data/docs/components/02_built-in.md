---
title: Built-in Components
description: Pre-built components available in the template
---

# Built-in Components

These components are included with the template and ready to use.

## Callout

Display important notices, warnings, and tips.

### Usage

```mdx
import { Callout } from '@components/Callout';

<Callout type="info">
  This is informational content.
</Callout>
```

### Types

| Type | Use Case |
|------|----------|
| `note` | General information |
| `tip` | Helpful suggestions |
| `info` | Contextual information |
| `warning` | Caution notices |
| `danger` | Critical warnings |

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | `'note'` | Visual style |
| `title` | `string` | Auto | Override title |

### Examples

```mdx
<Callout type="note">
  General notes appear with a blue accent.
</Callout>

<Callout type="tip" title="Pro Tip">
  Custom titles are supported.
</Callout>

<Callout type="warning">
  Warnings use an orange accent to grab attention.
</Callout>

<Callout type="danger">
  Danger callouts indicate critical information.
</Callout>
```

## CodeTabs

Display code snippets in multiple languages.

### Usage

```mdx
import { CodeTabs, Tab } from '@components/CodeTabs';

<CodeTabs>
  <Tab label="npm">
    ```bash
    npm install package-name
    ```
  </Tab>
  <Tab label="yarn">
    ```bash
    yarn add package-name
    ```
  </Tab>
  <Tab label="pnpm">
    ```bash
    pnpm add package-name
    ```
  </Tab>
</CodeTabs>
```

### Props

**CodeTabs:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTab` | `number` | `0` | Initially active tab |

**Tab:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Tab button text |

## Card

Link cards for navigation.

### Usage

```mdx
import { Card, CardGrid } from '@components/Card';

<CardGrid>
  <Card title="Quick Start" href="/docs/quick-start">
    Get up and running in minutes.
  </Card>
  <Card title="API Reference" href="/docs/api">
    Detailed API documentation.
  </Card>
</CardGrid>
```

### Props

**Card:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | Yes | Card heading |
| `href` | `string` | Yes | Link destination |
| `icon` | `string` | No | Icon identifier |

**CardGrid:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `number` | `2` | Grid columns |

## Steps

Numbered step-by-step instructions.

### Usage

```mdx
import { Steps, Step } from '@components/Steps';

<Steps>
  <Step title="Clone the repository">
    ```bash
    git clone https://github.com/user/repo.git
    ```
  </Step>
  <Step title="Install dependencies">
    ```bash
    npm install
    ```
  </Step>
  <Step title="Start development server">
    ```bash
    npm run dev
    ```
  </Step>
</Steps>
```

### Props

**Step:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | Yes | Step heading |

## Accordion

Collapsible content sections.

### Usage

```mdx
import { Accordion, AccordionItem } from '@components/Accordion';

<Accordion>
  <AccordionItem title="What is MDX?">
    MDX is Markdown with JSX support, allowing you to use
    React components in your markdown content.
  </AccordionItem>
  <AccordionItem title="How do I customize the theme?">
    Edit the `theme/colors.yaml` file to customize colors.
  </AccordionItem>
</Accordion>
```

### Props

**AccordionItem:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | Required | Header text |
| `open` | `boolean` | `false` | Initially expanded |

## Badge

Inline status indicators.

### Usage

```mdx
import { Badge } from '@components/Badge';

<Badge>Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `string` | `'default'` | Color variant |

## LinkButton

Styled button links.

### Usage

```mdx
import { LinkButton } from '@components/LinkButton';

<LinkButton href="/docs">
  Read the Docs
</LinkButton>

<LinkButton href="/docs" variant="secondary">
  Learn More
</LinkButton>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string` | Required | Link destination |
| `variant` | `string` | `'primary'` | Button style |
| `size` | `string` | `'medium'` | Button size |

## FileTree

Display directory structures.

### Usage

```mdx
import { FileTree } from '@components/FileTree';

<FileTree>
  - src/
    - components/
      - Button.astro
      - Card.astro
    - pages/
      - index.astro
    - styles/
      - global.css
  - package.json
</FileTree>
```

## Video

Embed videos with consistent styling.

### Usage

```mdx
import { Video } from '@components/Video';

<Video
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  title="Tutorial Video"
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `src` | `string` | Yes | Video embed URL |
| `title` | `string` | Yes | Accessibility title |
| `aspectRatio` | `string` | `'16/9'` | Video aspect ratio |

## Importing Components

All components can be imported from `@components`:

```mdx
import {
  Callout,
  CodeTabs,
  Tab,
  Card,
  CardGrid,
  Steps,
  Step,
  Accordion,
  AccordionItem,
  Badge,
  LinkButton,
  FileTree,
  Video,
} from '@components';
```

Or import individually:

```mdx
import { Callout } from '@components/Callout';
import { Card, CardGrid } from '@components/Card';
```
