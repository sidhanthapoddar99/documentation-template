# Folder Settings Reference

Every documentation folder (except the root doc folder) requires a `settings.json` file to configure how it appears in the sidebar.

## Basic Structure

```json
{
  "label": "Getting Started",
  "isCollapsible": true,
  "collapsed": false
}
```

## Configuration Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `label` | string | Yes | - | Display name shown in sidebar |
| `isCollapsible` | boolean | No | `true` | Whether section can be collapsed |
| `collapsed` | boolean | No | `false` | Initial collapsed state |

## Field Details

### `label` (Required)

The display name for the folder in the sidebar navigation.

```json
{
  "label": "API Reference"
}
```

- Can include spaces and special characters
- Should be human-readable
- Does NOT affect URL (that's determined by folder name)

### `isCollapsible`

Controls whether users can collapse/expand the section.

```json
{
  "isCollapsible": true
}
```

- `true` - Section can be collapsed (shows expand/collapse arrow)
- `false` - Section is always expanded (no arrow shown)

### `collapsed`

Sets the initial state when the page loads.

```json
{
  "collapsed": false
}
```

- `true` - Section starts collapsed (children hidden)
- `false` - Section starts expanded (children visible)
- Only applies if `isCollapsible` is `true`

## Common Configurations

### Always Expanded (Important Sections)

```json
{
  "label": "Getting Started",
  "isCollapsible": false
}
```

### Collapsed by Default (Large/Advanced Sections)

```json
{
  "label": "Advanced Topics",
  "isCollapsible": true,
  "collapsed": true
}
```

### Standard Collapsible Section

```json
{
  "label": "Guides",
  "isCollapsible": true,
  "collapsed": false
}
```

## Folder Structure Example

```
docs/
├── 01_getting-started/
│   ├── settings.json    <- { "label": "Getting Started", ... }
│   ├── 01_overview.md
│   └── 02_install.md
│
├── 02_guides/
│   ├── settings.json    <- { "label": "Guides", ... }
│   ├── 01_basics.md
│   └── 02_advanced.md
│
└── 03_api/
    ├── settings.json    <- { "label": "API Reference", ... }
    └── 01_endpoints.md
```

## Common Mistakes

### Missing settings.json

If a folder doesn't have `settings.json`, it may not appear correctly in the sidebar or may use the folder name as-is.

### Invalid JSON

Ensure valid JSON syntax:

```json
{
  "label": "My Section",
  "isCollapsible": true
}
```

Common errors:
- Missing quotes around strings
- Trailing commas after last property
- Using single quotes instead of double quotes
