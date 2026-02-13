/**
 * Docs Parser
 * Handles documentation content with XX_ prefix naming convention
 *
 * Features:
 * - Position extracted from XX_ filename prefix (e.g., 01_getting-started.md)
 * - Nested folder structure supported
 * - Assets relative to each file (./assets/code.py)
 * - Frontmatter: title, description, sidebar_label, sidebar_position, draft, tags
 */

import path from 'path';
import type { FileType, FrontmatterSchema, ParsedDocsFilename } from '../types';
import { BaseContentParser } from '../core/base-parser';
import { assetEmbedPreprocessor } from '../preprocessors/asset-embed';
import { headingIdsPostprocessor } from '../postprocessors/heading-ids';
import { internalLinksPostprocessor } from '../postprocessors/internal-links';
import { externalLinksPostprocessor } from '../postprocessors/external-links';

export class DocsParser extends BaseContentParser {
  constructor() {
    super('docs');

    // Configure pipeline for docs
    this.pipeline
      .addPreprocessor(assetEmbedPreprocessor)
      .addPostprocessor(headingIdsPostprocessor)
      .addPostprocessor(internalLinksPostprocessor)
      .addPostprocessor(externalLinksPostprocessor);
  }

  /**
   * Parse filename to extract position from XX_ prefix
   * e.g., "01_getting-started" → { position: 1, cleanName: "getting-started" }
   */
  parseFilename(filename: string): ParsedDocsFilename {
    const match = filename.match(/^(\d{2})_(.+)$/);
    if (match) {
      return {
        position: parseInt(match[1], 10),
        cleanName: match[2],
      };
    }
    return {
      position: null,
      cleanName: filename,
    };
  }

  /**
   * Resolve asset path relative to the document file
   * [[./assets/code.py]] → /path/to/doc/assets/code.py
   */
  getAssetPath(filePath: string, assetRelPath: string): string {
    const fileDir = path.dirname(filePath);
    return path.resolve(fileDir, assetRelPath);
  }

  /**
   * Get the frontmatter schema for docs
   */
  getFrontmatterSchema(): FrontmatterSchema {
    return {
      required: ['title'],
      optional: [
        'description',
        'sidebar_label',
        'sidebar_position',
        'draft',
        'tags',
      ],
    };
  }

  /**
   * Generate slug from relative path
   * Removes XX_ prefixes from all path segments for clean URLs
   */
  generateSlug(relativePath: string, fileType: FileType): string {
    // Get raw slug
    let slug = relativePath
      .replace(/\\/g, '/')
      .replace(/\.(mdx|md|yaml|yml|json)$/, '')
      .replace(/\/index$/, '');

    // Clean XX_ prefixes from all segments
    slug = slug
      .split('/')
      .map(segment => {
        const { cleanName } = this.parseFilename(segment);
        return cleanName;
      })
      .join('/');

    return slug;
  }
}

/**
 * Create a new docs parser instance
 */
export function createDocsParser(): DocsParser {
  return new DocsParser();
}
