## Goal

Certain pages, docs, and navbar items should be visible only during development. Use case: roadmap / todo docs visible in dev, hidden in prod.

## Page-level hiding

- [ ] `hideInProd: true` option in page config (`site.yaml`)
- [ ] `draft: true` or `devOnly: true` frontmatter for individual docs
- [ ] Filter dev-only pages during production build
- [ ] Visual indicator in dev mode for hidden pages

```yaml
# site.yaml
pages:
  todo:
    base_url: "/todo"
    type: docs
    layout: "@docs/default"
    data: "@data/docs/todo"
    hideInProd: true
```

## Navbar item hiding (independent)

- [ ] `hideInProd: true` option for navbar items
- [ ] Filter navbar items during production build
- [ ] Visual indicator (badge / icon) in dev mode for hidden items
- [ ] Support hiding nested dropdown items independently

```yaml
# navbar.yaml
items:
  - label: "Todo"
    href: "/todo"
    hideInProd: true
  - label: "Debug"
    hideInProd: true
    items:
      - label: "Cache Stats"
        href: "/debug/cache"
```

- [ ] Document the feature with examples
