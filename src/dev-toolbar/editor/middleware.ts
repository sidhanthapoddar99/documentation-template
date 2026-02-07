/**
 * Editor Middleware - HTTP endpoints for the live editor
 *
 * Adds Vite middleware to handle editor API requests:
 * - POST /__editor/open   — Open a document for editing
 * - POST /__editor/update — Update content and get re-rendered preview
 * - POST /__editor/save   — Save document to disk
 * - POST /__editor/close  — Close document (save + trigger reload)
 *
 * Dev-only: never loaded in production builds.
 */

import type { ViteDevServer } from 'vite';
import type { EditorStore } from './server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Parse JSON body from an incoming request
 */
function parseBody(req: any): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send a JSON response
 */
function sendJson(res: any, statusCode: number, data: any): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function setupEditorMiddleware(
  server: ViteDevServer,
  store: EditorStore,
  sendReload: () => void
): void {
  // Cache for combined content CSS
  let contentCSSCache: string | null = null;

  /**
   * Build combined CSS for the editor preview from theme + content styles.
   * Reads the theme CSS files and docs body styles, scopes them to .editor-preview.
   */
  function getContentCSS(): string {
    if (contentCSSCache) return contentCSSCache;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const srcRoot = path.resolve(__dirname, '../..');

    const cssFiles = [
      path.join(srcRoot, 'styles/color.css'),
      path.join(srcRoot, 'styles/font.css'),
      path.join(srcRoot, 'styles/element.css'),
      path.join(srcRoot, 'styles/markdown.css'),
      path.join(srcRoot, 'layouts/docs/components/body/default/styles.css'),
    ];

    let combined = '';
    for (const file of cssFiles) {
      try {
        if (fs.existsSync(file)) {
          combined += fs.readFileSync(file, 'utf-8') + '\n';
        }
      } catch { /* skip missing files */ }
    }

    contentCSSCache = combined;
    return combined;
  }

  server.middlewares.use(async (req: any, res: any, next: any) => {
    const url = req.url as string;

    // Only handle /__editor/* routes
    if (!url.startsWith('/__editor/')) {
      return next();
    }

    // GET /__editor/styles — serve combined content CSS
    if (url === '/__editor/styles' && req.method === 'GET') {
      const css = getContentCSS();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/css');
      res.setHeader('Cache-Control', 'no-cache');
      res.end(css);
      return;
    }

    // Only accept POST for other endpoints
    if (req.method !== 'POST') {
      return sendJson(res, 405, { error: 'Method not allowed' });
    }

    try {
      const body = await parseBody(req);

      switch (url) {
        case '/__editor/open': {
          const { filePath } = body;
          if (!filePath || typeof filePath !== 'string') {
            return sendJson(res, 400, { error: 'filePath is required' });
          }

          const doc = await store.openDocument(filePath);
          return sendJson(res, 200, {
            raw: doc.raw,
            rendered: doc.rendered,
            title: doc.frontmatter.title || 'Untitled',
          });
        }

        case '/__editor/update': {
          const { filePath, content } = body;
          if (!filePath || typeof filePath !== 'string') {
            return sendJson(res, 400, { error: 'filePath is required' });
          }
          if (typeof content !== 'string') {
            return sendJson(res, 400, { error: 'content is required' });
          }

          const doc = await store.updateDocument(filePath, content);
          return sendJson(res, 200, {
            rendered: doc.rendered,
            frontmatter: doc.frontmatter,
          });
        }

        case '/__editor/save': {
          const { filePath } = body;
          if (!filePath || typeof filePath !== 'string') {
            return sendJson(res, 400, { error: 'filePath is required' });
          }

          const result = store.saveDocument(filePath);
          return sendJson(res, 200, result);
        }

        case '/__editor/close': {
          const { filePath } = body;
          if (!filePath || typeof filePath !== 'string') {
            return sendJson(res, 400, { error: 'filePath is required' });
          }

          store.closeDocument(filePath);

          // Trigger full reload so the page refreshes with saved content
          sendReload();

          return sendJson(res, 200, { success: true });
        }

        default:
          return sendJson(res, 404, { error: 'Unknown editor endpoint' });
      }
    } catch (err: any) {
      console.error('[editor] Middleware error:', err);
      return sendJson(res, 500, { error: err.message || 'Internal server error' });
    }
  });

  console.log('[editor] Middleware registered (/__editor/*)');
}
