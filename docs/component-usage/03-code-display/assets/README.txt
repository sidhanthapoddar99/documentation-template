# Code Display Component Examples

This directory contains example files demonstrating the file-based CodeBlock component functionality.

## Available Examples

### JavaScript Example
- **File**: `example-agent.js`
- **Description**: A complete trading agent implementation using the NeuraLabs SDK

### Python Example
- **File**: `neural_processor.py`
- **Description**: Neural network processor module for AI inference

### Markdown Example
- **File**: `README.md` (this file)
- **Description**: Documentation example showing markdown rendering

## Usage

To display these files in your documentation, use the CodeBlock components with the `filePath` prop:

```jsx
<CollapsibleCodeBlock 
  filePath="./assets/example-agent.js"
  description="Complete trading agent implementation"
/>
```

## Features

- Automatic language detection based on file extension
- Syntax highlighting for multiple languages
- Collapsible interface for better space management
- Error handling for missing files
- Loading states for better UX