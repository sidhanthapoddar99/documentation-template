# Astro Documentation Framework - Architecture Info

> **Status:** Planning & Design Phase
>
> **Previous Code:** Moved to `old_code/` folder for reference

---

## Documents

| File | Description |
|------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | High-level architecture overview |
| [CONFIG_SCHEMA.md](./CONFIG_SCHEMA.md) | Configuration file schemas and types |
| [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md) | Complete directory structure |
| [DATA_LOADER.md](./DATA_LOADER.md) | Unified data loading engine |
| [DECISIONS.md](./DECISIONS.md) | Design decisions & open questions |

---

## Key Concepts

### 1. No `astro/` Subfolder
The project root IS the Astro project:
```
project/
├── src/            # Astro source
├── config/         # Via $CONFIG_DIR
├── data/           # Via $DATA_DIR
├── .env            # Path definitions
└── package.json
```

### 2. Alias-Based References
Even though `config/` and `data/` are in the repo, **code never references them directly**:
```env
# .env
CONFIG_DIR=./config
DATA_DIR=./data
```
This allows pointing to external folders if needed.

### 3. Fixed Page Structure
```
┌─────────────────┐
│     Navbar      │  ← Same for all routes
├─────────────────┤
│   Main Body     │  ← Varies (docs/blog/custom)
├─────────────────┤
│     Footer      │  ← Same for all routes
└─────────────────┘
```

### 4. Three Main Body Types
- **docs** - Documentation with sidebar + content + outline
- **blog** - Blog listing + blog posts
- **custom** - Custom pages (home, about, roadmap, etc.)

### 5. Layout Packages
Users select complete layout packages, not individual components:
```
@docs/doc_style1   → Full docs layout
@blog/blog_style1  → Full blog layout
@custom/home       → Home page template
```

### 6. @ Prefix System
```
@docs   → src/layouts/docs/
@blog   → src/layouts/blogs/
@custom → src/layouts/custom/
@data   → $DATA_DIR (from .env)
@mdx    → src/mdx_components/
```

### 7. Unified Data Engine
All layouts use the same data loading module for consistency.

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| No `astro/` folder | Root is the Astro project |
| Alias-based paths | Flexibility to point anywhere |
| Package-based layouts | Simpler UX, no mix-and-match |
| YAML configuration | Human-readable, easy to edit |
| @ prefix references | Clean, consistent syntax |
| Unified data loader | Consistent behavior everywhere |

---

## Open Questions

1. How many navbar/footer variants to provide?
2. Blog pagination strategy?
3. Theme customization depth?

---

## Next Steps

1. [ ] Finalize TypeScript interfaces
2. [ ] Create base layout packages
3. [ ] Implement data loader
4. [ ] Build navbar/footer variants
5. [ ] Create example content
6. [ ] Test route generation
