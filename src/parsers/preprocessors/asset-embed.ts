/**
 * Asset Embed Preprocessor
 * Handles [[path]] syntax for embedding file contents
 *
 * Features:
 * - [[./path/to/file]] embeds the raw file content
 * - \[[path]] escapes the syntax (shows literal [[path]])
 * - Works both inline and in code blocks
 * - Skips documentation examples (paths with spaces or commas)
 */

import fs from 'fs';
import path from 'path';
import type { Processor, ProcessContext } from '../types';
import { addError } from '../../loaders/cache';

export interface AssetEmbedOptions {
  /** Custom asset path resolver */
  resolvePath?: (filePath: string, assetPath: string, context: ProcessContext) => string;
}

/**
 * Create an asset embed preprocessor
 */
export function createAssetEmbedPreprocessor(options: AssetEmbedOptions = {}): Processor {
  return {
    name: 'asset-embed',
    process(content: string, context: ProcessContext): string {
      const { fileDir } = context;
      const resolvePath = options.resolvePath || defaultResolvePath;

      // Step 1: Protect fenced code blocks
      const codeBlocks: string[] = [];
      let result = content.replace(/(`{3,}|~{3,})[\s\S]*?\1/g, (match) => {
        codeBlocks.push(match);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
      });

      // Step 2: Protect inline code
      const inlineCode: string[] = [];
      result = result.replace(/`[^`]+`/g, (match) => {
        inlineCode.push(match);
        return `__INLINE_CODE_${inlineCode.length - 1}__`;
      });

      // Step 3: Protect escaped \[[...]]
      const escaped: string[] = [];
      result = result.replace(/\\\[\[([^\]]+)\]\]/g, (_match, inner) => {
        escaped.push(inner);
        return `__ESCAPED_ASSET_${escaped.length - 1}__`;
      });

      // Step 4: Replace [[path]] with file content
      result = result.replace(/\[\[([^\]]+)\]\]/g, (match, assetPath) => {
        const trimmedPath = assetPath.trim();
        const absolutePath = resolvePath(context.filePath, trimmedPath, context);

        try {
          if (!fs.existsSync(absolutePath)) {
            // Add error to cache for dev toolbar
            const relativePath = path.relative(context.basePath, context.filePath);
            addError({
              file: relativePath,
              type: 'asset-missing',
              message: `File not found: ${trimmedPath}`,
              suggestion: 'Create the file or update the embed path',
            });
            console.warn(`[asset-embed] File not found: ${absolutePath}`);
            return match;
          }

          return fs.readFileSync(absolutePath, 'utf-8').trimEnd();
        } catch (error) {
          const relativePath = path.relative(context.basePath, context.filePath);
          addError({
            file: relativePath,
            type: 'asset-missing',
            message: `Error reading file: ${trimmedPath}`,
            suggestion: 'Check file permissions and path',
          });
          console.error(`[asset-embed] Error reading file: ${trimmedPath}`, error);
          return match;
        }
      });

      // Step 5: Restore escaped [[...]]
      result = result.replace(/__ESCAPED_ASSET_(\d+)__/g, (_match, index) => {
        return `[[${escaped[parseInt(index)]}]]`;
      });

      // Step 6: Restore inline code
      result = result.replace(/__INLINE_CODE_(\d+)__/g, (_match, index) => {
        return inlineCode[parseInt(index)];
      });

      // Step 7: Restore and process code blocks
      result = result.replace(/__CODE_BLOCK_(\d+)__/g, (_match, index) => {
        let block = codeBlocks[parseInt(index)];

        // Process [[path]] inside code blocks (for actual embedding)
        block = block.replace(/\[\[([^\]]+)\]\]/g, (m, assetPath) => {
          const trimmedPath = assetPath.trim();

          // Skip documentation examples (contain spaces, commas, or don't start with ./)
          if (trimmedPath.includes(' ') || trimmedPath.includes(',') || !trimmedPath.startsWith('./')) {
            return m;
          }

          const absolutePath = resolvePath(context.filePath, trimmedPath, context);

          try {
            if (!fs.existsSync(absolutePath)) {
              // Add error to cache for dev toolbar
              const relativePath = path.relative(context.basePath, context.filePath);
              addError({
                file: relativePath,
                type: 'asset-missing',
                message: `File not found in code block: ${trimmedPath}`,
                suggestion: 'Create the file or update the embed path',
              });
              return m;
            }
            return fs.readFileSync(absolutePath, 'utf-8').trimEnd();
          } catch {
            return m;
          }
        });

        return block;
      });

      return result;
    },
  };
}

/**
 * Default path resolver - resolves relative to file directory
 */
function defaultResolvePath(filePath: string, assetPath: string, _context: ProcessContext): string {
  const fileDir = path.dirname(filePath);
  return path.resolve(fileDir, assetPath);
}

/**
 * Blog-specific path resolver
 * Resolves [[asset.jpg]] to assets/<filename>/asset.jpg
 */
export function createBlogAssetResolver(): AssetEmbedOptions['resolvePath'] {
  return (filePath: string, assetPath: string, _context: ProcessContext): string => {
    const blogDir = path.dirname(filePath);
    const filename = path.basename(filePath, path.extname(filePath));

    // If path already starts with ./ or ../, use default resolution
    if (assetPath.startsWith('./') || assetPath.startsWith('../')) {
      return path.resolve(blogDir, assetPath);
    }

    // Otherwise, resolve to assets/<filename>/<assetPath>
    return path.join(blogDir, 'assets', filename, assetPath);
  };
}

// Default preprocessor instance for docs
export const assetEmbedPreprocessor = createAssetEmbedPreprocessor();
