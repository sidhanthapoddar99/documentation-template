import { visit } from 'unist-util-visit';
import fs from 'fs';
import path from 'path';
import type { Root, Paragraph, Text, Code, Image, Html } from 'mdast';
import type { VFile } from 'vfile';

// Map file extensions to language identifiers for syntax highlighting
const extToLang: Record<string, string> = {
  'py': 'python',
  'js': 'javascript',
  'ts': 'typescript',
  'jsx': 'jsx',
  'tsx': 'tsx',
  'cpp': 'cpp',
  'c': 'c',
  'h': 'c',
  'hpp': 'cpp',
  'java': 'java',
  'go': 'go',
  'rs': 'rust',
  'rb': 'ruby',
  'php': 'php',
  'sh': 'bash',
  'bash': 'bash',
  'zsh': 'bash',
  'yaml': 'yaml',
  'yml': 'yaml',
  'json': 'json',
  'xml': 'xml',
  'html': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',
  'sql': 'sql',
  'md': 'markdown',
  'mdx': 'mdx',
  'toml': 'toml',
  'ini': 'ini',
  'env': 'bash',
  'dockerfile': 'dockerfile',
  'graphql': 'graphql',
  'gql': 'graphql',
};

function getLanguageFromExtension(filePath: string): string {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return extToLang[ext] || ext || 'text';
}

/**
 * Remark plugin to process [[type, path]] asset embed syntax.
 *
 * Note: This plugin is designed for standard Astro MDX processing.
 * For content loaded via the custom data loader, asset processing
 * happens in the data loader itself (src/loaders/data.ts).
 */
export function remarkAssets() {
  return (tree: Root, file: VFile) => {
    // Get the directory of the current file being processed
    const filePath = file.path || (file as any).history?.[0] || (file as any).data?.astro?.filePath;
    const fileDir = filePath ? path.dirname(filePath) : process.cwd();

    visit(tree, 'paragraph', (node: Paragraph, index: number | undefined, parent: any) => {
      // Check if paragraph has a single text child
      if (node.children.length !== 1 || node.children[0].type !== 'text') {
        return;
      }

      const textNode = node.children[0] as Text;
      const text = textNode.value.trim();

      // Match [[type, path]] pattern
      const match = text.match(/^\[\[(\w+),\s*(.+)\]\]$/);

      if (!match || index === undefined || !parent) {
        return;
      }

      const [, type, assetPath] = match;
      const absolutePath = path.resolve(fileDir, assetPath.trim());

      try {
        if (type === 'code') {
          // Read the file content
          if (!fs.existsSync(absolutePath)) {
            console.warn(`[remark-assets] File not found: ${absolutePath}`);
            return;
          }

          const content = fs.readFileSync(absolutePath, 'utf-8');
          const lang = getLanguageFromExtension(assetPath);
          const filename = path.basename(assetPath);

          // Replace with code block node
          const codeNode: Code = {
            type: 'code',
            lang: lang,
            meta: `title="${filename}"`,
            value: content.trimEnd(),
          };

          parent.children[index] = codeNode;

        } else if (type === 'img') {
          // Replace with image node
          const imageNode: Image = {
            type: 'image',
            url: assetPath,
            alt: path.basename(assetPath),
          };

          parent.children[index] = imageNode;

        } else if (type === 'video') {
          // Replace with HTML video element
          const htmlNode: Html = {
            type: 'html',
            value: `<video controls src="${assetPath}" style="max-width: 100%; height: auto;"></video>`,
          };

          parent.children[index] = htmlNode;

        } else {
          console.warn(`[remark-assets] Unknown asset type: ${type}`);
        }
      } catch (error) {
        console.error(`[remark-assets] Error processing asset: ${assetPath}`, error);
      }
    });
  };
}

export default remarkAssets;
