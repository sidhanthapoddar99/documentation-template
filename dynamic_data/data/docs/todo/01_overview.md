---
title: Project Roadmap
description: Overview of tasks and features to complete for the documentation framework
sidebar_label: Overview
---

# Project Roadmap

This document outlines the remaining tasks and planned features for the documentation framework.

---

## Core Features

### 1. Components Creation and Testing
- [ ] Build reusable UI components (cards, badges, buttons)
- [ ] Create component showcase/gallery page
- [ ] Add component documentation with live examples
- [ ] Test components across different themes

### 2. Blog Testing
- [ ] Test blog index layout
- [ ] Test blog post layout
- [ ] Verify date sorting and filtering
- [ ] Test author and tags functionality

### 3. Custom Pages
- [ ] Create more custom page layouts
- [ ] Test custom page data binding
- [ ] Build landing page templates
- [ ] Create about/contact page templates

---

## Layout & Styling

### 4. Creating More Layouts
- [ ] Additional doc layout styles (doc_style3, doc_style4)
- [ ] More sidebar variations (collapsible, icons, nested)
- [ ] Table of contents/outline improvements
- [ ] Alternative navbar styles
- [ ] Footer variations

### 5. Outline Not Appearing
- [ ] Debug outline/TOC rendering issue
- [ ] Ensure heading extraction works correctly
- [ ] Test across different doc pages

### 6. Fix Sizing Consistency
- [ ] Standardize max-width for navbar, footer, and content
- [ ] Create consistent spacing variables
- [ ] Ensure responsive breakpoints are aligned

### 7. Refine Theming
- [ ] Complete CSS variable coverage
- [ ] Test theme switching thoroughly
- [ ] Add more built-in themes
- [ ] Improve dark mode transitions

---

## Content Features

### 8. Mermaid and GraphViz Support
- [ ] Add Mermaid diagram rendering
- [ ] Add GraphViz/DOT diagram support
- [ ] Create diagram documentation
- [ ] Test diagram theming (light/dark)

### 9. Code Block Formatter
- [ ] Syntax highlighting improvements
- [ ] Line numbers option
- [ ] Copy button functionality
- [ ] Language labels
- [ ] Diff highlighting

---

## Configuration & Architecture

### 10. Deployment Module Setup
- [ ] Static export configuration
- [ ] Docker deployment support
- [ ] Vercel/Netlify deployment guides
- [ ] CI/CD pipeline templates

### 11. More Configs and Refinements
- [ ] Additional site.yaml options
- [ ] Per-page configuration overrides
- [ ] Environment-specific configs
- [ ] Config validation improvements

---

## Plugin & AI Features

### 12. Plugin Support
- [ ] Define plugin architecture
- [ ] Create plugin API
- [ ] Sample plugins (search, analytics)
- [ ] Plugin documentation

### 13. AI Modules
- [ ] AI-powered search (Elastic/vector search)
- [ ] AI summary generation for pages
- [ ] Graph view like Obsidian
- [ ] Hydration support for interactive features

---

## Developer Experience

### 14. Claude Skills
- [ ] Skill to create themes and validate
- [ ] Skill to create layouts and validate
- [ ] Skill to create components and validate
- [ ] Skill to create configs and validate
- [ ] Skill to write docs
- [ ] Skill to write blog posts
- [ ] Skill to create custom pages

### 15. Dev Toolbar Enhancements
- [ ] Footer and Header selector
- [ ] Doc with all themes preview
- [ ] Config generator showing current vs overridden settings
- [ ] Visual diff for changed variables

---

## Priority Matrix

| Priority | Task | Complexity |
|----------|------|------------|
| High | Outline not appearing | Medium |
| High | Fix sizing consistency | Low |
| High | Code block formatter | Medium |
| Medium | Mermaid/GraphViz support | Medium |
| Medium | More layouts | Medium |
| Medium | Deployment module | High |
| Low | Plugin support | High |
| Low | AI modules | High |
