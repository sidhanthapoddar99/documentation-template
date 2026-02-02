---
title: Bug Tracker
description: Known bugs and issues to fix
sidebar_label: Bugs
---

# Bug Tracker

Track known bugs and issues that need to be fixed.

---

## Open Bugs

### High Priority

| Bug | Description | Status | Found |
|-----|-------------|--------|-------|
| | | | |

### Medium Priority

| Bug | Description | Status | Found |
|-----|-------------|--------|-------|
| | | | |

### Low Priority

| Bug | Description | Status | Found |
|-----|-------------|--------|-------|
| | | | |

---

## Resolved Bugs

| Bug | Description | Resolution | Fixed |
|-----|-------------|------------|-------|
| Outline not appearing | TOC/outline wasn't rendering | Headings now extracted during parsing and cached | 2026-02-01 |
| Sidebar wrong URLs after delete | Sidebar pointed to /docs instead of configured base_url | Always pass baseUrl to layout props | 2026-02-02 |

---

## Bug Report Template

When reporting a bug, include:

```markdown
### Bug Title

**Description:**
Brief description of the issue.

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen.

**Actual Behavior:**
What actually happens.

**Environment:**
- Browser:
- OS:
- Node version:

**Screenshots:**
If applicable.
```

---

## How to Fix Bugs

1. Create a branch: `fix/bug-description`
2. Write a failing test (if applicable)
3. Fix the bug
4. Verify fix doesn't break other features
5. Update this tracker
6. Create PR
