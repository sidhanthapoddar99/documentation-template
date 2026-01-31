/**
 * Tag Transformer Registry
 * Infrastructure for registering and applying custom tag transformers
 *
 * Custom tags allow extending markdown with semantic components that
 * get transformed to HTML during processing.
 *
 * Example usage (for future transformers):
 * ```typescript
 * const registry = new TagTransformerRegistry();
 *
 * registry.register({
 *   tag: 'callout',
 *   transform(content, attrs) {
 *     const type = attrs.type || 'info';
 *     return `<div class="callout callout--${type}">${content}</div>`;
 *   }
 * });
 *
 * // In markdown:
 * // <callout type="warning">This is a warning</callout>
 * ```
 */

import type { TagTransformer, Processor, ProcessContext } from '../types';

export class TagTransformerRegistry {
  private transformers = new Map<string, TagTransformer>();

  /**
   * Register a new tag transformer
   */
  register(transformer: TagTransformer): void {
    if (this.transformers.has(transformer.tag)) {
      console.warn(`[transformers] Overwriting existing transformer for tag: ${transformer.tag}`);
    }
    this.transformers.set(transformer.tag, transformer);
  }

  /**
   * Unregister a tag transformer
   */
  unregister(tag: string): boolean {
    return this.transformers.delete(tag);
  }

  /**
   * Check if a transformer is registered for a tag
   */
  has(tag: string): boolean {
    return this.transformers.has(tag);
  }

  /**
   * Get a specific transformer
   */
  get(tag: string): TagTransformer | undefined {
    return this.transformers.get(tag);
  }

  /**
   * Get all registered tag names
   */
  getTags(): string[] {
    return Array.from(this.transformers.keys());
  }

  /**
   * Transform all registered custom tags in HTML content
   */
  transformAll(html: string): string {
    if (this.transformers.size === 0) {
      return html;
    }

    let result = html;

    for (const [tag, transformer] of this.transformers) {
      result = this.transformTag(result, tag, transformer);
    }

    return result;
  }

  /**
   * Transform a single custom tag type
   */
  private transformTag(html: string, tag: string, transformer: TagTransformer): string {
    // Match self-closing tags: <tag attr="value" />
    const selfClosingPattern = new RegExp(
      `<${tag}\\s*([^>]*?)\\s*/>`,
      'gi'
    );

    // Match tags with content: <tag attr="value">content</tag>
    const openClosePattern = new RegExp(
      `<${tag}\\s*([^>]*)>([\\s\\S]*?)</${tag}>`,
      'gi'
    );

    let result = html;

    // Transform self-closing tags
    result = result.replace(selfClosingPattern, (_match, attrsStr) => {
      const attrs = this.parseAttributes(attrsStr);
      return transformer.transform('', attrs);
    });

    // Transform tags with content
    result = result.replace(openClosePattern, (_match, attrsStr, content) => {
      const attrs = this.parseAttributes(attrsStr);
      return transformer.transform(content.trim(), attrs);
    });

    return result;
  }

  /**
   * Parse HTML-style attributes from a string
   */
  private parseAttributes(attrsStr: string): Record<string, string> {
    const attrs: Record<string, string> = {};

    if (!attrsStr || !attrsStr.trim()) {
      return attrs;
    }

    // Match attr="value" or attr='value' or attr=value or standalone attr
    const attrPattern = /(\w+)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;

    let match;
    while ((match = attrPattern.exec(attrsStr)) !== null) {
      const [, name, doubleQuoted, singleQuoted, unquoted] = match;
      const value = doubleQuoted ?? singleQuoted ?? unquoted ?? 'true';
      attrs[name] = value;
    }

    return attrs;
  }

  /**
   * Create a processor that can be added to a pipeline
   */
  createProcessor(): Processor {
    return {
      name: 'tag-transformer',
      process: (content: string, _context: ProcessContext) => {
        return this.transformAll(content);
      },
    };
  }
}

/**
 * Create a new transformer registry
 */
export function createTransformerRegistry(): TagTransformerRegistry {
  return new TagTransformerRegistry();
}

// Global registry instance (optional, for convenience)
export const globalRegistry = new TagTransformerRegistry();
