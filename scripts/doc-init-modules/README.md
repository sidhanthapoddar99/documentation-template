# Documentation Initialization Modules

This directory contains the modular components for the documentation initialization system. The modular design provides clear separation of concerns and makes it easy to distinguish between sections and subsections.

## Architecture

### Core Modules

1. **`constants.py`**
   - Defines constants and templates
   - Contains separate templates for sections and subsections
   - Section template: `sidebar-header` class, non-collapsible
   - Subsection template: collapsible and collapsed by default

2. **`config_loader.py`**
   - Handles loading YAML configuration files
   - Loads import templates
   - Manages custom imports

3. **`validators.py`**
   - Validates configuration structure
   - Ensures position consistency
   - Validates required fields

4. **`generators.py`**
   - `FrontMatterGenerator`: Creates MDX front matter
   - `CategoryGenerator`: Creates category.json files
     - `generate_section_category()`: For top-level sections
     - `generate_subsection_category()`: For nested subsections
   - `ContentGenerator`: Generates complete MDX file content

5. **`file_handler.py`**
   - Handles all file system operations
   - Creates directories and files
   - Manages placeholder files
   - Sanitizes filenames

6. **`structure_builder.py`**
   - Orchestrates the building process
   - Handles sections and subsections differently
   - Manages the recursive structure building

7. **`preview.py`**
   - Provides interactive preview of structure
   - Shows what will be created/updated
   - Asks for user confirmation

## Key Differences: Sections vs Subsections

### Sections (Top-Level)
- Generated with `sidebar-header` className
- `collapsible: false` - always expanded
- Typically represent major documentation areas
- Example category.json:
```json
{
  "label": "Introduction",
  "position": 1,
  "className": "sidebar-header",
  "collapsible": false
}
```

### Subsections (Nested)
- Can be nested at any level
- `collapsible: true` and `collapsed: true` by default
- Represent groupings within sections
- Example category.json:
```json
{
  "label": "Advanced Topics",
  "position": 3,
  "collapsible": true,
  "collapsed": true
}
```

## Usage

The modular system is used by `doc-init-modular.py`:

```bash
python scripts/doc-init-modular.py config.yaml imports.mdx
```

## Benefits of Modular Design

1. **Clear Separation**: Section and subsection logic is clearly separated
2. **Maintainability**: Each module has a single responsibility
3. **Extensibility**: Easy to add new features or modify behavior
4. **Testability**: Individual modules can be tested in isolation
5. **Reusability**: Modules can be reused in other tools