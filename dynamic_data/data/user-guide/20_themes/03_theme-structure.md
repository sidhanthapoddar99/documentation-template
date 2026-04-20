---
title: Theme Structure
description: Directory layout, theme.yaml manifest schema, file loading order, CSS merge order
sidebar_position: 3
---

# Theme Structure

Every theme is a folder with one required manifest (`theme.yaml`) and one or more CSS files. The loader reads the manifest, loads CSS files in declared order, optionally merges in a parent theme's CSS, and produces a single concatenated stylesheet that `BaseLayout.astro` injects into `<head>`.

## Directory layout

### Minimal theme

```
my-theme/
├── theme.yaml              ← required
└── color.css               ← required (at least one CSS file)
```

### Full custom theme

```
my-theme/
├── theme.yaml
├── color.css               colour variables + dark mode
├── font.css                font families, primitive scale, semantic tokens
├── element.css             spacing, radii, shadows, transitions
├── breakpoints.css         media-query reference (no runtime CSS)
├── reset.css               browser resets
├── markdown.css            .markdown-content scoped styles
├── navbar.css              navbar styling
├── footer.css              footer styling
├── docs.css                docs layout styling
├── blogs.css               blog layout styling
└── issues.css              issues layout styling (optional)
```

No single file is required by name — only `theme.yaml` is mandatory. The `files:` array in the manifest decides what loads. Filenames above are the default-theme convention; extending themes commonly override a subset.

### Built-in default theme

The default theme lives at `src/styles/` and serves as the base for almost every custom theme. Its files:

| File | Owns |
|---|---|
| `theme.yaml` | Manifest + `required_variables` contract |
| `color.css` | All 14 colors, light + dark mode |
| `font.css` | Primitive scale + semantic UI/content/display tokens |
| `element.css` | Spacing, radii, shadows, transitions, z-index, opacity, layout dimensions |
| `breakpoints.css` | Breakpoint documentation (no CSS — vars can't be used in `@media`) |
| `reset.css` | Browser resets |
| `markdown.css` | Rendered prose styling |
| `navbar.css` | Site navbar |
| `footer.css` | Site footer |
| `docs.css` | Docs layout (sidebar, outline, pagination) |
| `blogs.css` | Blog layouts (index + post) |
| `index.css` / `globals.css` | Bundler convenience — not listed in `files:` |

## `theme.yaml` manifest

```yaml
name: "My Theme"
version: "1.0.0"
description: "Purple accent theme extending default"

extends: "@theme/default"      # or null for standalone
override_mode: "merge"          # merge | override | replace
supports_dark_mode: true

files:
  - color.css
  - element.css

required_variables:
  colors:
    - --color-bg-primary
    # … (optional; inherit from parent if extends is set)
```

### Fields

| Field | Type | Required | Purpose |
|---|---|:---:|---|
| `name` | string | ✅ | Display name, shown in validation messages |
| `version` | string | ✅ | Semver. Stored, not enforced. |
| `description` | string | — | Human summary |
| `extends` | string \| null | — | Parent theme ref. `"@theme/default"` for the built-in, or another theme's name. `null` = standalone. |
| `override_mode` | enum | — | How child + parent CSS combine (see [Override Modes](#override-modes)). Default `merge`. |
| `supports_dark_mode` | bool | — | Declares intent; the loader doesn't enforce. Actual dark mode is in the CSS. |
| `files` | string[] | ✅ | CSS files to load, in order. Paths relative to the theme folder. |
| `required_variables` | object | — | Per-category contract override. If absent, inherits parent's contract (or uses default-theme's). |

### The `files:` array — order matters

CSS files are loaded and concatenated **in the order declared**. CSS cascade rules apply — later files override earlier ones for identical selectors. The default theme's order (`color.css` → `font.css` → `element.css` → component CSS) is the recommended order for any theme: variables first, then styling that consumes them.

### `required_variables` — inheriting vs overriding the contract

- **Omit** the field → inherit the parent's `required_variables` (normally the default theme's 46).
- **Declare** the field → your theme's contract replaces the parent's. You can shrink (drop variables layouts don't use) or extend (add variables your custom layouts need).

Most themes omit it. Only custom themes shipping their own layouts should declare it.

## File loading order — the merge

When a theme `extends: "@theme/default"`, the loader produces a single concatenated stylesheet like this:

```
/* --- Parent: @theme/default --- */
/* color.css (default)     */
/* font.css (default)      */
/* element.css (default)   */
/* breakpoints.css         */
/* reset.css               */
/* markdown.css (default)  */
/* navbar.css (default)    */
/* footer.css (default)    */
/* docs.css (default)      */
/* blogs.css (default)     */

/* --- Child Theme Overrides --- */
/* color.css (child)       */     ← redefines --color-brand-primary, etc.
/* element.css (child)     */     ← redefines --max-width-primary, etc.
```

Since the child's `color.css` comes **after** the parent's, CSS cascade means child `--color-brand-primary` wins. Same variable name, child value persists.

The inheritance can chain (theme B extends A extends default) — the loader resolves recursively, deepest-first.

## Override modes

The `override_mode` field decides what happens when the parent and child both provide a file with the same name (e.g. both have `color.css`):

| Mode | Behaviour | When to use |
|---|---|---|
| `merge` (default) | Load **both** files. Parent first, child second. CSS cascade applies — child wins for same selectors. | You want to *add* to the parent's CSS (extra variables, extra rules). |
| `override` | Load **only the child**, skip the parent's version of that file. Other parent files load normally. | You want to **replace** `color.css` entirely without inheriting its variables. |
| `replace` | Skip the entire parent theme. Child is standalone. | Effectively same as `extends: null`. Rarely used. |

Worth knowing that `merge` and `override` are per-file decisions — if your child has `color.css` and the parent has `color.css` and `font.css`:

- **merge** → both `color.css`s load (cascade resolves conflicts), `font.css` from parent loads.
- **override** → only child's `color.css` loads, parent's `color.css` is **skipped**, `font.css` from parent still loads.

The `override` mode is useful when the parent's `color.css` has values you don't want leaking through via cascade (e.g. you're replacing the colour scheme entirely and don't want accidental parent overrides).

## File roles

### Variables-defining files

These declare `:root { --foo: value; }` blocks. The default theme keeps them to:

- `color.css` — all 14 colours + dark-mode redefines under `[data-theme="dark"]`
- `font.css` — families, primitive scale, semantic UI + content + display tokens
- `element.css` — spacing, radii, shadows, transitions, z-index, opacity, layout dimensions

See [Tokens](./tokens/overview) for full per-file breakdown.

### Styling files

These consume variables to style actual elements — no `--foo:` declarations. Scoping:

- `markdown.css` — everything under `.markdown-content`
- `navbar.css` — everything under `.site-navbar` (or similar class)
- `footer.css`, `docs.css`, `blogs.css`, `issues.css` — similarly scoped per component

All styling files MUST consume variables — **no hardcoded colours, font sizes, or spacing.** See [Rules for Layout Authors](./rules-for-layout-authors).

### Reference files

- `breakpoints.css` — just a documentation stub. CSS variables can't be used inside `@media` queries, so breakpoints are a convention documented in comments, not values imported from variables.
- `reset.css` — browser resets, vanilla CSS, no variables.

## Asset files inside a theme

Themes can ship fonts, images, or other static assets:

```
my-theme/
├── theme.yaml
├── color.css
└── assets/
    ├── Inter-Regular.woff2
    └── Inter-Bold.woff2
```

Reference them in CSS with relative paths:

```css
@font-face {
  font-family: 'Inter';
  src: url('./assets/Inter-Regular.woff2') format('woff2');
}
```

The loader resolves relative paths against the theme folder.

## See also

- [Theme Contract](./the-theme-contract) — the 46 required variables
- [Tokens / Overview](./tokens/overview) — per-category variable reference
- [Inheritance and Override](./inheritance-and-override) — modes + cascade rules, deeper
- [Creating Themes / Quick Start](./creating-themes/quick-start) — first theme, hands-on
