/**
 * Dynamic route to serve assets from @assets folder
 *
 * Assets location is configured via ASSETS_DIR in .env
 * Default: ./dynamic_data/data/assets/
 * Accessed via /assets/filename.ext URLs
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import fs from 'fs';
import path from 'path';
import { getAssetsPath } from '@loaders/paths';

// MIME type mapping
const mimeTypes: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dirPath: string, basePath: string = ''): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dirPath)) {
    return files;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, relativePath));
    } else if (entry.isFile() && !entry.name.startsWith('.')) {
      files.push(relativePath);
    }
  }

  return files;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const assetsDir = getAssetsPath();
  const files = getAllFiles(assetsDir);

  return files.map((filePath) => ({
    params: { path: filePath },
  }));
};

export const GET: APIRoute = async ({ params, request }) => {
  const filePath = params.path;

  if (!filePath) {
    return new Response('Not found', { status: 404 });
  }

  const assetsDir = getAssetsPath();
  const fullPath = path.join(assetsDir, filePath);

  // Security: ensure the path is within the assets directory
  const normalizedPath = path.normalize(fullPath);
  if (!normalizedPath.startsWith(assetsDir)) {
    return new Response('Forbidden', { status: 403 });
  }

  if (!fs.existsSync(fullPath)) {
    return new Response('Not found', { status: 404 });
  }

  const stat = fs.statSync(fullPath);
  const etag = `"${stat.size}-${stat.mtimeMs}"`;
  const lastModified = stat.mtime.toUTCString();

  // Check If-None-Match for 304
  const ifNoneMatch = request.headers.get('If-None-Match');
  if (ifNoneMatch === etag) {
    return new Response(null, { status: 304 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  const content = fs.readFileSync(fullPath);

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
      'ETag': etag,
      'Last-Modified': lastModified,
    },
  });
};
