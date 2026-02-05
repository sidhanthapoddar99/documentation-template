# Documentation Workflows

Step-by-step guides for common documentation tasks.

---

## Create a New Documentation Section

A section is a folder containing related documentation pages.

### Steps

1. **Choose position number**
   - Check existing folders to find the right position
   - Leave gaps (01, 05, 10) for future insertions

2. **Create the folder**
   ```bash
   mkdir XX_section-name
   ```
   Example: `mkdir 05_tutorials`

3. **Create settings.json**
   ```json
   {
     "label": "Tutorials",
     "isCollapsible": true,
     "collapsed": false
   }
   ```

4. **Create the first page**
   ```bash
   touch 01_overview.md
   ```

5. **Add frontmatter and content**
   ```yaml
   ---
   title: Tutorials Overview
   description: Learn through hands-on tutorials
   ---

   # Tutorials Overview

   Welcome to our tutorials section...
   ```

6. **Create assets folder (optional)**
   ```bash
   mkdir assets
   ```

### Checklist

- [ ] Folder has `XX_` prefix
- [ ] `settings.json` exists with `label`
- [ ] First page has `XX_` prefix
- [ ] Frontmatter has `title`
- [ ] H1 matches frontmatter title

---

## Create a New Documentation Page

### Steps

1. **Choose position number**
   - Check existing files in the folder
   - Use next available number or leave gaps

2. **Create the file**
   ```bash
   touch XX_page-name.md
   ```
   Example: `touch 03_configuration.md`

3. **Add frontmatter**
   ```yaml
   ---
   title: Configuration Guide
   description: How to configure the application
   ---
   ```

4. **Add content starting with H1**
   ```markdown
   # Configuration Guide

   This guide explains how to configure...
   ```

### Checklist

- [ ] File has `XX_` prefix
- [ ] Frontmatter has `title`
- [ ] H1 matches frontmatter title
- [ ] Content uses proper heading hierarchy

---

## Add Assets to a Page

### Steps

1. **Create assets folder** (if not exists)
   ```bash
   mkdir assets
   ```

2. **Add your files**
   ```
   assets/
   ├── example.py
   ├── config.yaml
   └── diagram.png
   ```

3. **Reference in markdown**

   For code files (embed contents):
   ~~~markdown
   ```python
   [[./assets/example.py]]
   ```
   ~~~

   For images:
   ```markdown
   ![Diagram description](./assets/diagram.png)
   ```

---

## Create a Nested Subsection

For deeper hierarchy within a section.

### Steps

1. **Navigate to parent section**
   ```
   docs/02_guides/
   ```

2. **Create subsection folder**
   ```bash
   mkdir 03_advanced
   ```

3. **Add settings.json**
   ```json
   {
     "label": "Advanced Topics",
     "isCollapsible": true,
     "collapsed": true
   }
   ```

4. **Add pages with XX_ prefix**
   ```bash
   touch 01_overview.md
   touch 02_optimization.md
   ```

### Result

```
docs/
└── 02_guides/
    ├── settings.json
    ├── 01_basics.md
    ├── 02_intermediate.md
    └── 03_advanced/
        ├── settings.json
        ├── 01_overview.md
        └── 02_optimization.md
```

---

## Reorder Pages

To change the order of pages in the sidebar.

### Steps

1. **Identify current order**
   ```
   01_overview.md      <- Position 1
   02_installation.md  <- Position 2
   03_configuration.md <- Position 3
   ```

2. **Rename files with new prefixes**
   ```bash
   mv 02_installation.md 01_installation.md
   mv 01_overview.md 02_overview.md
   ```

3. **Result**
   ```
   01_installation.md  <- Now first
   02_overview.md      <- Now second
   03_configuration.md <- Unchanged
   ```

**Tip:** Leave gaps in numbering (01, 05, 10) to make reordering easier.

---

## Mark a Page as Draft

To hide a page from production while keeping it in development.

### Steps

1. **Add draft frontmatter**
   ```yaml
   ---
   title: Upcoming Feature
   description: Documentation for a feature in development
   draft: true
   ---
   ```

2. **Page behavior**
   - Visible in development builds
   - Hidden in production builds
   - Can still be accessed by direct URL in development

---

## Add Code Examples with Tabs

For showing the same concept in multiple languages.

### Example

```markdown
<tabs>
  <tab label="JavaScript">
    ```javascript
    const response = await fetch('/api/users');
    const users = await response.json();
    ```
  </tab>
  <tab label="Python">
    ```python
    import requests
    response = requests.get('/api/users')
    users = response.json()
    ```
  </tab>
  <tab label="cURL">
    ```bash
    curl -X GET https://api.example.com/users
    ```
  </tab>
</tabs>
```
