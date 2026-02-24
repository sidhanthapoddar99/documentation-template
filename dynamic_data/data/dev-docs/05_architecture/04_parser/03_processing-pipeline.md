---
title: "Step 2: Processing Pipeline"
description: How the pipeline orchestrates content transformation through core components
sidebar_position: 3
---

# Processing Pipeline

**Folders:** `src/parsers/core/`

The processing pipeline orchestrates content transformation by managing the sequential execution of preprocessors, the renderer, and postprocessors.

## Role in the Pipeline

```
                          Content Type Parser
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              CORE  ◀── YOU ARE HERE                     │
│                     ProcessingPipeline                                  │
│              (Manages the sequential execution)                         │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
    Preprocessors            Renderer             Postprocessors
```

## Core Files

| File | Purpose |
|------|---------|
| `core/pipeline.ts` | `ProcessingPipeline` class - orchestrates the flow |
| `core/base-parser.ts` | `BaseContentParser` abstract class - shared parser logic |
| `core/index.ts` | Module exports |

## Pipeline Architecture

```
    Raw Markdown
         │
         ▼
┌─────────────────┐
│  Preprocessors  │  ← Transform before rendering (sequential)
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Renderer     │  ← MD → HTML (Marked)
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Postprocessors  │  ← Enhance HTML output (sequential)
│                 │
└────────┬────────┘
         │
         ▼
     Final HTML
```

## Basic Usage

```typescript
import { ProcessingPipeline } from '@parsers/core';

const pipeline = new ProcessingPipeline();

// Add processors
pipeline
  .addPreprocessor(assetEmbedPreprocessor)
  .addPostprocessor(headingIdsPostprocessor)
  .addPostprocessor(externalLinksPostprocessor);

// Process content
const html = await pipeline.process(rawMarkdown, context, render);
```

## Pipeline Methods

### Adding Processors

```typescript
// Preprocessors run BEFORE markdown rendering
pipeline.addPreprocessor(processor);

// Postprocessors run AFTER HTML rendering
pipeline.addPostprocessor(processor);
```

### Processing Content

```typescript
// Full pipeline execution
const html = await pipeline.process(raw, context, renderFn);

// Or run stages individually
const preprocessed = await pipeline.preprocess(raw, context);
const rendered = await renderFn(preprocessed);
const final = await pipeline.postprocess(rendered, context);
```

### Inspecting Pipeline

```typescript
// Get registered processors
const preprocs = pipeline.getPreprocessors();
const postprocs = pipeline.getPostprocessors();
```

## Process Context

Every processor receives a context object:

```typescript
interface ProcessContext {
  filePath: string;      // Absolute path to file
  fileDir: string;       // Directory containing file
  contentType: string;   // 'docs' | 'blog' | 'page'
  frontmatter: object;   // Parsed frontmatter
  basePath: string;      // Base content directory
}
```

## Processor Interface

All processors implement this interface:

```typescript
interface Processor {
  name: string;
  process: (content: string, context: ProcessContext) => string | Promise<string>;
}
```

## Error Handling

The pipeline catches and reports processor errors:

```typescript
try {
  result = await processor.process(result, context);
} catch (error) {
  console.error(`[pipeline] Preprocessor "${processor.name}" failed:`, error);
  throw error;
}
```

## How BaseContentParser Uses Pipeline

The `BaseContentParser` in `core/base-parser.ts` ties everything together:

```typescript
// In parseMarkdownFile method
const context: ProcessContext = {
  filePath,
  fileDir,
  contentType: this.contentType,
  frontmatter,
  basePath,
};

// Process through pipeline
const content = await this.pipeline.process(rawContent, context, this.render);
```

## Creating a Pipeline

```typescript
import { createPipeline } from '@parsers/core';

// Create empty pipeline
const pipeline = createPipeline();

// Or create with processors
import { assetEmbedPreprocessor } from '@parsers/preprocessors';
import { headingIdsPostprocessor } from '@parsers/postprocessors';

const pipeline = createPipeline()
  .addPreprocessor(assetEmbedPreprocessor)
  .addPostprocessor(headingIdsPostprocessor);
```
