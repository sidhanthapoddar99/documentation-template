---
author: sidhantha
date: 2026-04-27
---

## Post-refactor audit sweep — 4 parallel agents

Ran a 4-agent parallel audit (alias resolution / setup-flow framing / template references / plugin-skill consistency) over the user-guide + plugin skill + root README + framework code, after the consumer-mode reframe + template-move. Logging the findings + fixes here so the audit trail is preserved.

### What the audit caught

| # | File | Issue | Severity |
|---|---|---|---|
| 1 | \`/.env.example:6\` | Still referenced \`./dynamic_data/config\` (missed by the 57-file rename sweep). \`LAYOUT_EXT_DIR\` line was also bogus (\`../data/layouts\`, escapes the repo). | CRITICAL — broke fresh dogfood clones. |
| 2 | \`README.md:32–43, 73–77\` | "Manual setup" section described dogfood-mode as the default consumer flow (\"git clone ... my-docs / cp .env.example .env / edit default-docs/data/\"). The folder tree labelled \`default-docs/\` as \"USER-EDITABLE content + config\" — exactly the framing we just spent the day removing from the user-guide. | CRITICAL. |
| 3 | \`astro-doc-code/src/loaders/paths.ts:129\` | \`RESERVED_KEYS\` was missing \`'issues'\` even though \`@issues\` is a system alias. A user declaring \`paths: { issues: \"...\" }\` would have silently shadowed the system alias. | CRITICAL — actual code bug, not a docs issue. |
| 4 | \`05_getting-started/03_aliases.md:125,129\` | YAML-comment examples wrote \`# src/layouts/docs/styles/default/\` and \`# src/layouts/blogs/styles/default/\` — the literal \`/styles/\` segment doesn't exist in the actual filesystem (path is \`src/layouts/<type>/<style>/\`). | CRITICAL — misleading. |
| 5 | \`05_getting-started/06_init-and-template.md:53\` | Said \"four short questions\" then listed 5. Off-by-one. | CRITICAL — small but visible. |
| 6 | \`05_getting-started/02_installation.md:112\` | Told users to open \`http://localhost:3088\` but Astro's actual default is 4321 (3088 is just what this repo's \`.env\` happens to set). | NIT. |
| 7 | \`plugins/documentation-guide/template/README.md\` | Showed \`.env.example → .env (CONFIG_DIR=./config)\` as if the user-project root would carry \`.env\`. In the documented consumer flow \`.env\` lives inside the framework folder created post-clone, with \`CONFIG_DIR=../config\`. | NIT. |
| 8 | \`plugins/documentation-guide/template/.env.example\` | Same issue from the \`.env.example\` side — \`CONFIG_DIR=./config\` shown without qualification, misleads anyone inspecting the bundled template. | NIT. |
| (extra) | \`plugins/documentation-guide/skills/documentation-guide/references/settings-layout.md:294\` | The \`@root/<sub>\` row already said \"NOT the consumer's outer project root\" — sharpened to also call out \"the framework's install location on disk\" + \"\`documentation-template/\` in consumer mode, the repo root in dogfood mode\". | NIT. |

### What was fixed in this pass

All 8 above. Specifically:

1. \`/.env.example\` — rewritten with explicit \"this is for dogfood mode\" header + both modes' \`CONFIG_DIR\` and \`LAYOUT_EXT_DIR\` examples shown.
2. \`README.md\` — \"Manual setup\" section restructured to lead with **consumer mode** (clone framework as a subfolder, write own \`config/data/assets/themes/\`, \`.env\` with \`CONFIG_DIR=../config\` inside framework folder), with dogfood mode as the second option for framework-dev. Folder tree relabelled: \`default-docs/\` is \"framework's BUNDLED content (this repo's docs + testbed)\" with explicit consumer-vs-dogfood explanation paragraph below.
3. \`paths.ts:129\` — added \`'issues'\` to \`RESERVED_KEYS\`.
4. \`03_aliases.md\` — dropped the literal \`/styles/\` segment from both YAML-comment examples.
5. \`06_init-and-template.md\` — fixed count to \"five short questions (the last is optional)\" and marked the 5th \"*(optional)*\".
6. \`02_installation.md\` — port instruction now leads with 4321 (Astro default) with a parenthetical noting this repo's \`.env\` ships PORT=3088 for dogfood.
7. \`template/README.md\` — \"Layout once copied\" section now explicitly notes \`.env\` is **not written by init**, it lives inside the framework folder created post-clone, with the consumer-mode value \`CONFIG_DIR=../config\`. Also notes that \`README.md\` is excluded from the rsync.
8. \`template/.env.example\` — added a multi-line header explaining \"this is reference only\" + recommended consumer-mode value (\`CONFIG_DIR=../config\` inside the framework folder).
+ Settings-layout.md \`@root/<sub>\` row sharpened.

### What the audit confirmed CLEAN

- No other broken alias usage anywhere in user-guide or skill.
- No other stale \`astro-doc-code/template/\` references in current docs (only in tracker history, intentionally preserved).
- No other \"edit default-docs/\" anti-patterns in the user-guide (the earlier reframe was thorough).
- Plugin skill + 5 references are internally consistent with the user-guide on the consumer-mode framing.
- \`scripts/_env.mjs\` policy is sound; one remaining stale \`PROJECT_ROOT\` reference in \`_lib.mjs\` was already fixed earlier today.

### Build verification

\`./start build\` after all 8 fixes: **339 pages, 10.06s, clean.** No regressions.

### Note on tracker history

References to \`astro-doc-code/template/\` remain in this issue's older subtask checklists and in the \`001_consumer-mode-refactor-checkpoint\` comment. Those are preserved as historical record (the same convention used for the \`dynamic_data/\` rename sweep) — they accurately describe the world at the moment they were written. The current source of truth is now: template lives **only** in \`plugins/documentation-guide/template/\`.
