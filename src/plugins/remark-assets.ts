import { visit } from 'unist-util-visit';
import fs from 'fs';
import path from 'path';
import type { Root, Paragraph, Text } from 'mdast';
import type { VFile } from 'vfile';

/**
 * Remark plugin to process [[path]] asset embed syntax.
 * Simply replaces [[path]] with raw file content.
 * Use \[[path]] to escape.
 *
 * Note: For content loaded via the custom data loader, asset processing
 * happens in the data loader itself (src/loaders/data.ts).
 */
export function remarkAssets() {
  return (tree: Root, file: VFile) => {
    const filePath = file.path || (file as any).history?.[0];
    const fileDir = filePath ? path.dirname(filePath) : process.cwd();

    visit(tree, 'text', (node: Text, index: number | undefined, parent: any) => {
      if (!node.value || index === undefined || !parent) return;

      let value = node.value;
      let changed = false;

      // Handle escaped \[[...]] - convert to placeholder
      const escaped: string[] = [];
      value = value.replace(/\\\[\[([^\]]+)\]\]/g, (match, inner) => {
        escaped.push(inner);
        changed = true;
        return `__ESCAPED_ASSET_${escaped.length - 1}__`;
      });

      // Replace [[path]] with file content
      value = value.replace(/\[\[([^\]]+)\]\]/g, (match, assetPath) => {
        const trimmedPath = assetPath.trim();
        const absolutePath = path.resolve(fileDir, trimmedPath);

        try {
          if (!fs.existsSync(absolutePath)) {
            console.warn(`[remark-assets] File not found: ${absolutePath}`);
            return match;
          }

          changed = true;
          return fs.readFileSync(absolutePath, 'utf-8').trimEnd();
        } catch (error) {
          console.error(`[remark-assets] Error reading file: ${trimmedPath}`, error);
          return match;
        }
      });

      // Restore escaped [[...]]
      value = value.replace(/__ESCAPED_ASSET_(\d+)__/g, (match, idx) => {
        return `[[${escaped[parseInt(idx)]}]]`;
      });

      if (changed) {
        node.value = value;
      }
    });
  };
}

export default remarkAssets;
