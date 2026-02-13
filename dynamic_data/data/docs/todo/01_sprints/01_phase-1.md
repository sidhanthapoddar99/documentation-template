---
title: "Phase 1: Foundation & Core Polish"
description: Essential fixes and improvements to stabilize the framework
sidebar_label: Phase 1
---

# Phase 1: Foundation & Core Polish

**Goal:** Stabilize core functionality, fix sizing issues, and complete essential features.

---

## 1. Fix Sizing Consistency

- [x] ~~Standardize max-width for navbar, footer, and content~~ (Completed: `--max-width-primary`/`--max-width-secondary`)
- [x] ~~Create consistent spacing variables (CSS custom properties)~~ (Completed: Renamed vars, applied `--spacing-2xl` padding)
- [x] ~~Fix docs layout centering~~ (Completed: Removed `justify-content: center`, added `margin: 0 auto` on content)
- [ ] Ensure responsive breakpoints are aligned across components
- [ ] Document spacing system in theming guide

## 2. Code Block Enhancements

- [x] ~~Syntax highlighting improvements (more languages)~~ (Completed: Shiki with 20+ languages)
- [x] ~~Dual-theme support (light/dark)~~ (Completed: github-light/github-dark themes)
- [x] ~~Fix light mode syntax highlighting~~ (Completed: Removed incorrect CSS override)
- [x] ~~Grey background for code blocks in light mode~~ (Completed: `--color-bg-secondary`)
- [ ] Line numbers option
- [ ] Copy button functionality
- [ ] Language labels display
- [ ] Diff highlighting support

## 3. Outline/TOC Polish

- [x] ~~Debug outline/TOC rendering issue~~ (Fixed)
- [x] ~~Ensure heading extraction works correctly~~ (Fixed)
- [x] ~~Highlight active heading in outline~~ (Completed: Scroll tracking with RAF throttling)
- [ ] Test outline across different doc pages
- [ ] Add smooth scroll to headings

## 4. Blog Testing & Polish

- [x] ~~Fix blog parser (was using docs parser)~~ (Completed: Added missing `'blog'` content type)
- [ ] Test blog index layout thoroughly
- [ ] Test blog post layout
- [ ] Verify date sorting and filtering
- [ ] Test author and tags functionality
- [ ] Add pagination to blog index

## 5. Theme Refinements

- [x] ~~Complete CSS variable coverage for layout dimensions~~ (Completed: `--max-width-primary`/`--max-width-secondary`)
- [x] ~~Update all layouts to use new variables~~ (Completed: docs, blog, navbar, footer, features)
- [x] ~~Test theme switching thoroughly~~ (Completed: Light/dark mode working)
- [x] ~~Fix shiki syntax highlighting in both themes~~ (Completed)
- [ ] Improve dark mode transitions (smooth fade)
- [ ] Document all theme variables

---

## Deliverables

| Item | Status |
|------|--------|
| Consistent sizing across layouts | ✅ Completed |
| Enhanced code blocks | 🔄 In Progress (4/8 done) |
| Polished outline component | 🔄 In Progress (3/5 done) |
| Working blog layouts | 🔄 In Progress (1/6 done) |
| Complete theme variable coverage | ✅ Completed |

---

## Success Criteria

- No visual inconsistencies between navbar, content, and footer widths
- Code blocks have copy button and line numbers
- Outline highlights current section while scrolling
- Blog index and post pages work correctly
- Theme switching is smooth with no flash
