---
title: "Method 2 — manual / from-source usage (clone + run)"
done: false
---

The "developer / contributor" usage path: clone the repo, run `./start`, do whatever you want with the source. No CLI tool to install, no Docker container, no `docs.conf` file required. This method exists explicitly to provide **total control** — if you want to hack on the framework itself, edit layouts, add custom hooks, or just understand what's running, this is the entry point.

## Status — mostly already done

Today's restructure (the `astro-doc-code/` move + the `./start` wrapper + the `frameworkRoot`/`projectRoot` split in `paths.ts`) **is** Method 2. It already works end-to-end. What's left for this subtask is:

1. Re-verify it after subtask 01 lands (the `dynamic_data/` → `default-docs/` rename + `@root` alias touch enough surface to be worth a smoke test).
2. Document it as a **first-class supported method**, not just "the dev workflow." Users who want full control should know this is a legitimate way to use the framework, not a fallback.

## Why mention "no config file required"

Method 1 (CLI) introduces `docs.conf` as a clean, named config file. Method 3 (Docker) probably does too. Method 2 deliberately does **not** require either, because if you have the source you can:

- Use the existing `.env` convention (set `CONFIG_DIR`, `PORT`, `HOST`, `LAYOUT_EXT_DIR` there)
- Pass env vars on the command line (`PORT=5000 ./start dev`)
- Edit `astro-doc-code/astro.config.mjs` directly to hardcode anything
- Skip `.env` entirely — the framework's defaults work for the in-repo case

`.env` stays as **convention** for Method 2, not a requirement. Setting it via env vars or editing the source is fully supported. This is the point of from-source mode: the framework doesn't impose a config-file abstraction on someone who already has the code in hand.

## Checklist

- [ ] After subtask 01 lands (rename + alias), smoke-test Method 2 end-to-end: clone fresh, run `./start`, verify build + dev still pass without modification
- [ ] Add a "Running from source" page (or section in getting-started) to the user-guide that documents Method 2 explicitly — frames it as "for contributors, framework hackers, or anyone who wants total control"
- [ ] In CLAUDE.md / README, note Method 2 alongside the future Methods 1 and 3 so all three are visible as parallel options
- [ ] Confirm `.env` continues to be supported after `docs.conf` lands in Method 1 — the framework should accept either, with `docs.conf` as the named-config preference and `.env` as the from-source convention

## Out of scope

- Anything specific to the CLI or Docker methods (covered by future subtasks 03 and 04 once those are filed).
- Documenting how to contribute to the framework itself (separate concern — this subtask is about *running* from source, not *contributing*).
