---
title: "CLI language decision — comparison of native + JS-bundle options"
description: Cross-language comparison (C / Rust / Go / Zig / Bun-compile / Deno-compile) for the framework CLI binary. Used to decide between rewriting the 11 shell wrappers natively vs bundling existing .mjs scripts. Recommendation lands on Go for the sweet spot of startup, binary size, cross-compile, and AI-assisted dev velocity. Referenced from subtask 05_absorb-shell-wrappers-into-binary.
sidebar_label: CLI Language Decision
---

# CLI language decision

Choosing the language for the framework's CLI binary (Method 1 in `2026-04-26-framework-as-cli-tool`, plus the absorbed shell wrappers from subtask 05). For a CLI like ours (read tracker files, parse JSON/YAML/MD, filter, occasionally hash for cache), here's the honest comparison. Metrics that overlap have been grouped (e.g. "fastest" = "compute" = "performance" for our purposes; "startup" ≈ "latency" for cold-start CLI use).

## Table 1 — full cross-language comparison

| Metric | **C** | **Rust** | **Go** | **Zig** | **Bun (compile)** | **Deno (compile)** |
|---|---|---|---|---|---|---|
| **Binary size** | 50KB–1MB | 1–5MB (MUSL) | 5–15MB | 50KB–500KB | **60–90MB** | **80–110MB** |
| **Startup time (cold)** | <1ms | <1ms | 2–5ms | <1ms | 30–60ms | 50–150ms |
| **Latency / first byte** | <1ms | <1ms | 2–5ms | <1ms | 30–60ms | 50–150ms |
| **RAM (resident, idle CLI)** | 1–5MB | 2–8MB | 10–30MB | 1–5MB | 60–150MB | 80–150MB |
| **Compute / raw perf** | top tier | top tier | very good (GC) | top tier | good (V8 JIT) | good (V8) |
| **Text search / grep speed** | fast (DIY) | **fastest** (ripgrep is Rust) | fast | fast | medium | medium |
| **Regex / complex search** | manual (PCRE) | **best** (regex crate, RE2-class, no backref by default) | good (RE2 stdlib) | manual | good (V8 with backref) | good (V8) |
| **Multi-core search** | pthreads (manual) | **Rayon, excellent** | **goroutines, excellent** | manual ergonomic | worker_threads (limited) | Workers (limited) |
| **OS reads/writes** | direct syscall | thin wrapper | thin runtime wrapper | direct syscall | libuv async | libuv-equiv |
| **OS page-cache use** | same | same | same | same | same | same |
| **Hash a whole folder** | fastest (SIMD SHA / blake3) | fastest (blake3 reference impl is Rust) | fast (stdlib + blake3 lib) | fast | medium (Node crypto OK, but I/O+startup) | medium |
| **Memory safety** | ❌ manual (UAF, leaks) | ✅ compile-checked | ✅ GC + runtime | ⚠️ optional, better than C | ✅ runtime-safe | ✅ runtime-safe |
| **Dev speed (with AI)** | slow (boilerplate, footguns) | medium (borrow-checker friction even w/ good models) | **fast** (huge training corpus, simple lang, batteries) | slow (sparse training data) | **fastest** (reuse existing .mjs verbatim) | fast |
| **Ecosystem for our CLI** | sparse | rich (clap, serde, ripgrep, walkdir) | rich (cobra, viper, bubbletea) | thin | reuse our scripts | similar |
| **Cross-compile** | manual per target | excellent | excellent | **best in class** (built into compiler) | per-target Bun build | per-target Deno build |

## Where the table is misleading

- **"OS page cache" is identical** across every option — the kernel does the caching, the language doesn't matter once you're hitting `read()`. The thing that differs is *startup cost* per invocation, which is why Bun/Deno feel slow even though their underlying I/O is fine.
- **"Search time"** is dominated by what you measure. For a single 200KB file, all options finish in under 5ms — search-speed gaps only become visible across thousands of files (which our tracker isn't, today).
- **"Hash whole folder"** — once SIMD-accelerated SHA-256 / blake3 is in play, the bottleneck is disk I/O, not language. For our cache-key sizes (a few hundred files), C/Rust/Go are within ~10% of each other.
- **Bun/Deno startup** compounds: a Claude session calling `docs list` 50 times pays 1.5–3s of pure startup tax vs ~250ms for Go.

## Table 2 — three real options for *this* CLI

| | **Bun-compile** (least work) | **Go** (sweet spot) | **Rust** (max perf) |
|---|---|---|---|
| Effort | zero rewrite — bundle existing `.mjs` | port 11 small scripts to Go | port 11 small scripts to Rust |
| Binary | ~80MB | ~10MB | ~3MB |
| Startup tax / call | ~50ms | ~3ms | ~1ms |
| AI dev velocity | highest (TS/JS) | high (huge corpus, simple) | medium (still good with Claude, but borrow checker eats time) |
| Distribution story | per-platform Bun build | clean cross-compile | clean cross-compile |

## Recommendation

**Go.** Best balance of startup, binary size, cross-compile, and AI-dev speed. Rust wins on perf/size but the gap doesn't matter for this workload, and you'll spend more time fighting the compiler than shipping subcommands. Bun-compile is tempting as a "ship today" move, but the 60–80MB artefact and per-call startup cost will start to grate when Claude is invoking it 50× per session.

## One nuance worth flagging

If the binary needs to call into framework loaders (validators, theme resolution), neither Go nor Rust can reuse the TS code directly — they'd shell out to `bun scripts/...` for those commands. Bun-compile is the only option that lets the binary consume framework code natively. So the deciding question is really: *do the wrappers ever need framework internals?* If yes for >2-3 commands, Bun-compile climbs up the list.

For our current 11 wrappers, only the validators (`docs-check-blog`, `docs-check-config`, `docs-check-section`) likely benefit from framework-internal access. The other 8 are pure file/JSON manipulation against the tracker — trivially native in Go.

## Decision

*(Pending — user to lock in. Working assumption: Go, with shell-out to `bun scripts/...` for the 3 validators.)*
