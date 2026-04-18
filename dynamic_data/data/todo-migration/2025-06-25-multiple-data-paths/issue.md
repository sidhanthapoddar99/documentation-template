## Goal

Multiple data sources can be configured and accessed via `@alias` paths.

## Tasks

- [x] YAML config for paths in `site.yaml`
  ```yaml
  paths:
    data: "../data"
    assets: "../assets"
    themes: "../themes"
    # data2: "/other/project/data"   # → @data2/...
  ```
- [x] Path resolution utilities (`@loaders/alias.ts` with `resolveAliasPath()`)
- [x] Support `@key/subpath` alias format (`@data`, `@assets`, `@themes`)
- [x] Standardize all path inputs to use this pattern (all configs use `@` aliases)
- [x] Handle both relative and absolute paths (resolved at config load time)
- [ ] Validate paths exist on startup
- [ ] Update documentation for new path system
