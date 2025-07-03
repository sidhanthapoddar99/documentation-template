# Documentation Initialization System

This system automates the creation of properly structured documentation sections following the established patterns in the Docusaurus codebase. It generates numbered folders, MDX files with correct front matter, category configurations, and asset folders.

## Quick Start

### Basic Usage

```bash
# Create documentation from a YAML configuration
python scripts/doc-init.py scripts/doc-init/example.yaml scripts/doc-init/imports.mdx

# With custom base directory
python scripts/doc-init.py scripts/doc-init/example.yaml scripts/doc-init/imports.mdx --base-docs-path custom-docs
```

### Interactive Preview

Before creating any files, the script shows a detailed preview:

```
📋 Structure Preview:
==================================================
📂 example-docs/  (new)
  📂 01-getting-started/  (new)
    📄 _category_.json  (new)
    📄 01-introduction.mdx  (new)
    📄 02-installation-guide.mdx  (new)
    📂 assets/  (new)
      📄 __placeholder__  (new)
      📂 assets/02-installation-guide/  (new)
        📄 __placeholder__  (new)
  📂 02-api-reference/  (new)
    📄 _category_.json  (new)
    📄 01-overview.mdx  (new)
    📄 02-endpoints.mdx  (new)
==================================================
Legend: Green = New files/folders, Normal = Existing
Note: Existing MDX files will be preserved, category.json files will be updated

Proceed with creating this structure? (y/N):
```

### What Gets Created

The script generates a complete documentation structure:

```
docs/your-section/
├── 01-getting-started/
│   ├── _category_.json
│   ├── 01-introduction.mdx
│   ├── 02-installation-guide.mdx
│   └── assets/
│       ├── __placeholder__
│       └── 02-installation-guide/
│           └── __placeholder__
├── 02-api-reference/
│   ├── _category_.json
│   ├── 01-overview.mdx
│   └── 02-endpoints.mdx
```

## Features

### ✅ **Non-Destructive Updates**
- **Preserves existing content**: Never overwrites existing MDX files
- **Adds missing files**: Creates new files when structure is updated
- **Updates configuration**: Always updates `_category_.json` files to match structure

### ✅ **Proper Structure**
- **Numbered folders**: Automatic numbering (01-, 02-, etc.)
- **Sidebar headers**: Correct `className: "sidebar-header"` configuration
- **Front matter**: Proper MDX front matter with IDs, titles, descriptions
- **Asset management**: Asset folders with placeholder files for git tracking

### ✅ **Flexible Configuration**
- **Standard imports**: Automatic inclusion of common components
- **Subsections**: Support for nested documentation structures
- **Interactive preview**: See exactly what will be created before proceeding
- **Custom positioning**: Optional position control for sidebar ordering

## YAML Configuration Format

### Basic Structure

```yaml
section_name: "your-section-name"  # Required: becomes the main folder name

sections:
  - title: "Section Title"        # Used for folder name (auto-slugified)
    label: "Display Label"        # Used in sidebar
    position: 2                  # Optional: custom sidebar position
    create_assets: true          # Optional: create section-level assets folder
    
    files:
      - title: "File Title"      # Used for filename and front matter
        description: "File desc"  # Used in front matter
        position: 1              # Optional: custom sidebar position
        create_assets: true      # Optional: create file-specific assets folder

    # Optional: Subsections within this section
    subsections:
      - title: "Subsection Title"
        label: "Subsection Label"
        position: 1              # Optional: custom sidebar position
        files:
          - title: "Nested File"
            description: "Nested file description"
            position: 1          # Optional: custom sidebar position
        
        # Optional: Nested subsections (unlimited depth)
        subsections:
          - title: "Nested Subsection"
            label: "Nested Subsection"
            position: 2          # Optional: custom sidebar position
            files:
              - title: "Deep Nested File"
                description: "File in nested subsection"
```

### File Naming Rules

The script automatically converts titles to valid filenames:

- `"API Reference"` → `02-api-reference.mdx`
- `"Getting Started"` → `01-getting-started/`
- `"Cards & Containers"` → `03-cards-containers/`

### Front Matter Generation

Each MDX file gets proper front matter:

```yaml
---
id: api-reference
title: API Reference
description: Complete API documentation
sidebar_position: 2  # Auto-generated or custom position
---
```

### Position Control

The `position` field is optional and provides fine-grained control over sidebar ordering:

- **Auto-generated positions**: Files are numbered 1, 2, 3... based on their order in the YAML
- **Custom positions**: Override the auto-generated positions by specifying `position: N`
- **Mixed positioning**: If ANY item in a section has a position, ALL items must have positions
- **Validation**: Positions must be unique integers from 1 to the total number of items

**Rules:**
- Within each section: files and subsections share the same position numbering (1, 2, 3...)
- Within each subsection: files and nested subsections share the same position numbering (1, 2, 3...)
- Positions are independent between different sections/subsections
- **Default order**: Files come first, then subsections (when no positions specified)
- **Nested subsections**: Supports unlimited nesting depth

## Advanced Features

### Generated MDX Files

Each created MDX file contains:

```mdx
---
id: file-id
title: File Title
description: File description
sidebar_position: 1
---

// Standard imports (all custom components)
import { Card, CardHeader, CardTitle, CardDescription } from '@site/src/components/elements/Card';
import { Callout } from '@site/src/components/elements/Callout';
// ... other imports

# File Title
```

The file is ready for content to be added manually after creation.

### Asset Folder Structure

When `create_assets: true` is specified:

```
section/
├── assets/
│   ├── __placeholder__          # Section-level assets
│   └── 01-filename/
│       └── __placeholder__      # File-specific assets
```

Use file-specific asset folders for:
- Code examples: `./assets/01-filename/example.js`
- Diagrams: `./assets/01-filename/diagram.mermaid`
- Images: `./assets/01-filename/screenshot.png`

### Subsections

Create nested documentation structures:

```yaml
sections:
  - title: "API Reference"
    label: "API Reference"
    files:
      - title: "Overview"
        description: "API overview"
    
    subsections:
      - title: "Authentication"
        label: "Authentication"
        files:
          - title: "OAuth Setup"
            description: "Setting up OAuth"
          - title: "API Keys"
            description: "Managing API keys"
```

This creates:
```
02-api-reference/
├── _category_.json
├── 01-overview.mdx
└── 01-authentication/
    ├── _category_.json
    ├── 01-oauth-setup.mdx
    └── 02-api-keys.mdx
```

## Examples

### Simple Documentation Section

**Basic Example:**
```yaml
section_name: "user-guide"

sections:
  - title: "Getting Started"
    label: "Getting Started"
    files:
      - title: "Installation"
        description: "How to install the software"
      - title: "First Steps"
        description: "Your first steps with the platform"

  - title: "Advanced Topics"
    label: "Advanced Topics"
    files:
      - title: "Configuration"
        description: "Advanced configuration options"
      - title: "Troubleshooting"
        description: "Common issues and solutions"
```

**Example with Custom Positions:**
```yaml
section_name: "user-guide"

sections:
  - title: "Advanced Topics"
    label: "Advanced Topics"
    files:
      - title: "Configuration"
        description: "Advanced configuration"
        position: 2  # Will be 02-configuration.mdx
      
      - title: "Quick Reference"
        description: "Quick reference guide"
        position: 3  # Will be 03-quick-reference.mdx
      
    subsections:
      - title: "Deployment"
        label: "Deployment"
        position: 1  # Will be 01-deployment/ (appears first)
        files:
          # These have separate numbering within the subsection
          - title: "Production"
            description: "Production deployment"
            position: 1  # Will be 01-production.mdx
          - title: "Development"
            description: "Development setup"
            position: 2  # Will be 02-development.mdx
```

This creates the structure:
```
advanced-topics/
├── 01-deployment/           # subsection with position 1
│   ├── 01-production.mdx    # file with position 1 (within subsection)
│   └── 02-development.mdx   # file with position 2 (within subsection)
├── 02-configuration.mdx     # file with position 2 (within section)
└── 03-quick-reference.mdx   # file with position 3 (within section)
```

**Example with Nested Subsections and Default Order:**
```yaml
section_name: "platform-docs"

sections:
  - title: "API Documentation"
    label: "API Documentation"
    files:
      - title: "Quick Start"      # Will be 01-quick-start.mdx
        description: "Get started with the API"
      - title: "Overview"         # Will be 02-overview.mdx  
        description: "API overview"
    
    subsections:
      - title: "Authentication"   # Will be 03-authentication/ (after files)
        label: "Authentication"
        files:
          - title: "Basic Auth"   # Will be 01-basic-auth.mdx
            description: "Basic authentication"
          - title: "OAuth"        # Will be 02-oauth.mdx
            description: "OAuth flow"
        
        subsections:
          - title: "Advanced"     # Will be 03-advanced/ (nested subsection)
            label: "Advanced Authentication"
            files:
              - title: "JWT"      # Will be 01-jwt.mdx
                description: "JWT tokens"
```

Creates the nested structure:
```
api-documentation/
├── 01-quick-start.mdx       # files come first
├── 02-overview.mdx          # files come first
└── 03-authentication/       # subsections come after files
    ├── 01-basic-auth.mdx    # files come first in subsection
    ├── 02-oauth.mdx         # files come first in subsection
    └── 03-advanced/         # nested subsection comes after files
        └── 01-jwt.mdx       # file in nested subsection
```

**Usage:**
```bash
python scripts/doc-init.py scripts/doc-init/simple.yaml scripts/doc-init/imports.mdx
```

## Standard Imports Template

The `scripts/doc-init/imports.mdx` file contains standard imports that are included in every generated MDX file:

```jsx
// Custom Components
import { Card, CardHeader, CardTitle, CardDescription } from '@site/src/components/elements/Card';
import { Callout } from '@site/src/components/elements/Callout';
import { CollapsibleCodeBlock, InlineCodeCard, FileCollapsibleCodeBlock, FileInlineCodeCard } from '@site/src/components/elements/CodeBlock';
import { Features, Feature } from '@site/src/components/elements/Features';
import { CustomMermaid, MermaidDiagram } from '@site/src/components/elements';
import { GraphViz, GraphVizDiagram } from '@site/src/components/elements';

// Theme Components
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';
```

These imports are automatically included in every generated MDX file, ensuring consistency across the documentation.

## Best Practices

### 1. **Structure Planning**
- Plan your documentation hierarchy before creating YAML
- Use descriptive section and file titles
- Group related content logically

### 2. **Asset Organization**
- Use file-specific asset folders for better organization
- Store code examples as separate files in assets
- Use descriptive filenames for assets

### 3. **Content Strategy**
- Start with basic structure, add content iteratively
- Use the non-overwrite feature to safely update structures
- Content is added manually after file creation

### 4. **Import Management**
- All standard imports are included in every file automatically
- Imports are consistent across all documentation files

## Command Line Options

```bash
python scripts/doc-init.py [options] <config_path> <imports_path>

Arguments:
  config_path        Path to YAML configuration file
  imports_path       Path to imports template file

Options:
  --base-docs-path   Base documentation directory (default: docs)
  -h, --help         Show help message
```

## Troubleshooting

### Common Issues

**Problem: "Configuration file not found"**
- Solution: Check the path to your YAML file
- Ensure the file exists and is readable

**Problem: "Invalid YAML"**
- Solution: Validate your YAML syntax
- Check indentation (use spaces, not tabs)
- Ensure proper quoting of strings with special characters

**Problem: "Position validation errors"**
- Solution: Ensure all items in a section have positions if any item has a position
- Check that positions are unique integers from 1 to N
- Verify no duplicate position values

**Problem: "Files not being created"**
- Solution: Check file permissions in the target directory
- Ensure the base docs path exists

**Problem: "Import errors in generated MDX"**
- Solution: Verify that all imported components exist in the codebase
- Check the imports template file for syntax errors

### Validation Tips

1. **Test YAML syntax**: Use online YAML validators
2. **Start simple**: Begin with basic examples, add complexity gradually
3. **Check paths**: Ensure all referenced files exist
4. **Preview structure**: Run with a test directory first

### Debugging

Enable verbose output by modifying the script temporarily:

```python
# Add at the beginning of generate_documentation()
import pprint
pprint.pprint(self.config)
```

## Integration with Development Workflow

### Version Control
- Commit YAML configuration files to track documentation structure
- The `__placeholder__` files ensure asset directories are tracked
- Generated MDX files can be edited normally after creation

### CI/CD Integration
- Run the script in CI to ensure documentation structure consistency
- Use it to bootstrap documentation for new features
- Validate YAML files in pre-commit hooks

### Team Collaboration
- Share YAML configurations for consistent documentation structure
- Use the non-overwrite feature to safely update shared documentation
- Create team-specific import templates for different types of documentation

## Contributing

To extend the documentation initialization system:

1. **Add new features** to `scripts/doc-init.py`
2. **Create example configurations** in `scripts/doc-init/`
3. **Update this README** with new features and examples
4. **Test with existing documentation** to ensure compatibility

## File Reference

- `scripts/doc-init.py` - Main script
- `scripts/doc-init/imports.mdx` - Standard imports template
- `scripts/doc-init/example.yaml` - Simple example configuration
- `scripts/README.md` - This documentation