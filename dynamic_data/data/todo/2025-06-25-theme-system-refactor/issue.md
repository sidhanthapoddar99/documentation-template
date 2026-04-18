## Goal

Move the theme system from "ad-hoc CSS variables that layouts invent as needed" to a declared, enforced contract with a clean primitive / semantic split.

## What changed

- **`src/styles/theme.yaml → required_variables`** is now the authoritative contract every theme (built-in and user) must satisfy. Themes that omit a required variable fail loudly.
- **Two-tier token model.** Themes declare a primitive scale (`--font-size-xs/sm/base/lg/...`, the colour palette, spacing, etc.). Layouts consume only **semantic tokens** that map onto the primitives:
  - `--ui-text-micro / body / title` for chrome (3 tiers — that's the whole UI palette; emphasis comes from weight + colour, not a 4th size).
  - `--content-body / h1 / h2 / h3 / h4 / h5 / h6 / code` for rendered markdown.
  - `--display-sm / md / lg` for marketing / hero surfaces only.
- **No layout invents variable names.** Inline fallbacks like `var(--color-accent, #7aa2f7)` are gone — they were how dark/light mode silently broke.
- **Why this matters:** a redesign that bumps UI chrome to a denser scale won't accidentally shrink markdown headings; reviewers don't have to guess whether `--font-size-lg` in a layout means "large UI" or "h4 content".

See subtasks for status.
