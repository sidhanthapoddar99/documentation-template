## Goal

Claude skills accelerate the most common authoring and configuration tasks in the framework.

## Tasks (post-architecture-pivot)

The originally-planned 5 separate skills were consolidated into **one umbrella skill**, `documentation-guide`, with per-domain reference files. See `comments/002_architecture-pivot-and-status.md` for the rationale, and `comments/003` + `comments/004` for the validation tests (22 test agents, 100% correctness, 30% faster than baseline in real-world / multi-task usage).

- [x] Skill to author + edit documentation content → `documentation-guide` (`references/writing.md` + `references/docs-layout.md`)
- [x] Skill to write blog posts → `documentation-guide` (`references/blog-layout.md`)
- [x] Skill to operate the issue tracker → `documentation-guide` (`references/issue-layout.md` + 9 helper scripts under `scripts/issues/`)
- [x] Skill to configure the site (site.yaml / navbar.yaml / footer.yaml / .env / paths / themes) → `documentation-guide` (`references/settings-layout.md` + `scripts/config/check.mjs`)
- [x] Validation scripts per domain → `scripts/{docs,blog,config,issues}/check.mjs`
- [ ] Skill to create / validate custom themes — out of scope; the skill points users at `user-guide/25_themes/` for now
- [ ] Skill to create / validate custom layouts — out of scope for now
- [ ] Skill to create / validate custom Astro components — out of scope for now
- [ ] Skill to scaffold custom pages (home, info, countdown, etc.) — out of scope for now
- [ ] User-guide skill catalogue + `download-skills.{mjs,sh}` updated to match the single-skill architecture (see `subtasks/07_update-readme-and-download-scripts.md`)

## Completed

- ✅ **`documentation-guide`** umbrella skill — validated by 22 test agents (12 single-task + 10 bundled multi-task) at 100% correctness
- ✅ Five reference files: `writing.md`, `docs-layout.md`, `blog-layout.md`, `issue-layout.md`, `settings-layout.md`
- ✅ 9 issue-tracker helper scripts: `list`, `show`, `subtasks`, `agent-logs`, `set-state`, `add-comment`, `add-agent-log`, `review-queue`, `check`
- ✅ 4 domain validation scripts: `docs/check`, `blog/check`, `config/check`, `issues/check`
- ✅ `dynamic_data/data/README.md` — data layout map (read by the skill at task start)
- ✅ Loader bug fix: comment author + date now also read from frontmatter when the filename uses the looser `NNN_<slug>.md` pattern (avatars no longer fall back to "?")
- ✅ Old `.claude/skills/docs-guide/` and `.claude/skills/docs-settings/` retired
