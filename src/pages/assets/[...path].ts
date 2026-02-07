/**
 * Dynamic route to serve assets from all asset-category directories
 *
 * Asset directories are configured via site.yaml paths: section.
 * Multiple asset dirs are searched in order (first match wins).
 * Accessed via /assets/filename.ext URLs.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import fs from 'fs';
import path from 'path';
import { getAssetsPath, getPathsByCategory } from '@loaders/paths';

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

/**
 * Get all asset directories (from path system)
 */
function getAssetDirs(): string[] {
  const dirs = getPathsByCategory('asset');
  // Fallback to primary assets path if no asset-category paths registered
  if (dirs.length === 0) {
    dirs.push(getAssetsPath());
  }
  return dirs;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const assetDirs = getAssetDirs();
  const seen = new Set<string>();
  const paths: { params: { path: string } }[] = [];

  // Collect files from all asset dirs (first dir wins on conflicts)
  for (const dir of assetDirs) {
    const files = getAllFiles(dir);
    for (const file of files) {
      if (!seen.has(file)) {
        seen.add(file);
        paths.push({ params: { path: file } });
      }
    }
  }

  return paths;
};

export const GET: APIRoute = async ({ params, request }) => {
  const filePath = params.path;

  if (!filePath) {
    return new Response('Not found', { status: 404 });
  }

  const assetDirs = getAssetDirs();

  // Search all asset dirs in order (first match wins)
  let fullPath: string | null = null;
  let matchedDir: string | null = null;

  for (const dir of assetDirs) {
    const candidate = path.join(dir, filePath);
    const normalized = path.normalize(candidate);

    // Security: ensure the path is within the asset directory
    if (!normalized.startsWith(dir)) {
      continue;
    }

    if (fs.existsSync(normalized)) {
      fullPath = normalized;
      matchedDir = dir;
      break;
    }
  }

  if (!fullPath || !matchedDir) {
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
