## Goal

Two new first-class content types — **Roadmap** and **Releases** — sit alongside the existing layouts and round out the storytelling surface for a documentation site.

## Currently available content types

| Type | Layout entry | Use case |
|---|---|---|
| `docs` | `@docs/default`, `@docs/compact` | Sidebar-driven documentation |
| `blog` | `@blog/default` | Dated posts with index + detail |
| `issues` | `@issues/default` | GitHub-style issue tracker (folder-per-item) |
| `custom` | `@custom/home`, `@custom/info`, `@custom/countdown` | Freeform pages (home, about, countdown) |

## Why these two

- **Roadmap** — a public-facing forward-looking view: what's planned, what's in flight, when. Pulls from `issues` data filtered by milestone, but presented as a timeline / lane view rather than a list. Lets users see "what's coming" without scanning the tracker.
- **Releases** — a backward-looking changelog: what shipped, when, with what changes. Each release is a folder with a date, title, summary, and list of issues / PRs included. Index sorts newest-first; detail page renders the changelog body.

See subtasks for each.
