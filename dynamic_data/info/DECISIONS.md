# Design Decisions & Open Questions

> **Note:** Previous code moved to `old_code/` folder.

This document tracks design decisions and open questions.

---

## Confirmed Decisions

### ✅ D1: Package-Based Layouts
**Decision:** Users select complete layout packages, not individual components.

**Rationale:**
- Simpler user experience
- Layouts designed to work together
- Easier to maintain consistency
- Avoids "mix-and-match" complexity

### ✅ D2: Unified Data Loader
**Decision:** All content types use the same data loading engine.

**Rationale:**
- Consistent behavior
- Single source of truth for parsing
- Easier debugging
- Predictable API

### ✅ D3: YAML Configuration
**Decision:** Use YAML for user-facing configuration.

**Rationale:**
- Human-readable
- Comments supported
- Widely understood format
- Easy to edit without IDE

### ✅ D4: @ Prefix System
**Decision:** Use `@` prefix for path references.

**Rationale:**
- Clean syntax
- Clear distinction from relative paths
- Familiar pattern (like npm scopes)

### ✅ D5: Settings per Doc Section
**Decision:** Each doc folder can have its own `settings.json`.

**Rationale:**
- Different sections may need different settings
- Sidebar behavior, sorting, etc. per-section
- Template reads and applies settings

### ✅ D6: Docs Sidebar Auto-Generated
**Decision:** Sidebar generated from folder structure.

**Rationale:**
- Matches file organization
- Less manual configuration
- Settings control behavior (sorting, collapsing)

### ✅ D7: Custom Page Data Flexibility
**Decision:** Custom pages can accept YAML, JSON, or MDX.

**Rationale:**
- Different use cases need different formats
- YAML/JSON for structured data (home page)
- MDX for content-heavy pages
- Layout decides how to handle

---

## Open Questions

### ❓ Q1: How many navbar variants?
**Options:**
1. 3 variants (minimal, standard, expanded)
2. 5 variants (more choices)
3. 1 variant with many options (configurable)

**Leaning toward:** 3-4 fixed variants

---

### ❓ Q2: How many footer variants?
**Options:**
1. 2 variants (default, minimal)
2. 4 variants (simple, columns, expanded, none)

**Leaning toward:** 2-3 fixed variants

---

### ❓ Q3: Blog pagination strategy?
**Options:**
1. Single `blog_index.astro` handles pagination
2. Separate `blog_index.astro` + `blog_page_[page].astro`
3. Infinite scroll (JS-based)

**Leaning toward:** Single file with query params

---

### ❓ Q4: Multiple data directories?
**How should this work?**

Option A: Multiple DATA_DIR env vars
```env
DATA_DIR=../data
DATA_DIR_EXTERNAL=../external-docs
```

Option B: Aliases in config
```yaml
data_sources:
  main: "../data"
  external: "../external-docs"
```

**Leaning toward:** Option B (config-based)

---

### ❓ Q5: Theme customization depth?
**Options:**
1. Color presets only (minimal CSS customization)
2. Color presets + Tailwind config
3. Full CSS variable override system

**Leaning toward:** Color presets + CSS variables

---

### ❓ Q6: Search integration?
**Options:**
1. Pagefind (static, built-in)
2. Algolia (external service)
3. Custom (build-time index + JS search)
4. None (feature flag)

**Leaning toward:** Pagefind as default, Algolia optional

---

### ❓ Q7: Route conflict detection?
**When to validate?**
1. Build time only
2. Dev server startup
3. Config file change (hot reload)

**Leaning toward:** All three (fail fast)

---

## Decisions to Make

| ID | Question | Priority | Status |
|----|----------|----------|--------|
| Q1 | Navbar variants | High | Open |
| Q2 | Footer variants | High | Open |
| Q3 | Blog pagination | Medium | Open |
| Q4 | Multiple data dirs | Medium | Open |
| Q5 | Theme customization | Medium | Open |
| Q6 | Search integration | Low | Open |
| Q7 | Route validation | Low | Open |

---

## Implementation Notes

### For Navbar/Footer
- Start with 2-3 variants each
- Can add more later
- Each variant is a complete package

### For Blog
- Start with pagination in single file
- Query params: `/blog?page=2`
- Can optimize later if needed

### For Data Directories
- Start with single DATA_DIR
- Add multi-source support if requested
- Keep API consistent

### For Themes
- Start with 5 color presets
- CSS variable override system
- Tailwind config optional
