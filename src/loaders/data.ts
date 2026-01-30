/**
 * Unified Data Loader - Single engine for loading all content types
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { glob } from 'glob';
import { getDataPath, paths } from './paths';

// ============================================
// Asset Embedding - [[type, path]] syntax
// ============================================

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Process [[type, path]] asset embeds in content
 */
function processAssetEmbeds(content: string, fileDir: string): string {
  // Match [[type, path]] patterns on their own line
  const assetPattern = /^\[\[(\w+),\s*(.+)\]\]$/gm;

  return content.replace(assetPattern, (match, type, assetPath) => {
    const trimmedPath = assetPath.trim();
    const absolutePath = path.resolve(fileDir, trimmedPath);

    try {
      if (type === 'code') {
        if (!fs.existsSync(absolutePath)) {
          console.warn(`[asset-embed] File not found: ${absolutePath}`);
          return match; // Return original if file not found
        }

        const fileContent = fs.readFileSync(absolutePath, 'utf-8');
        const lang = getLanguageFromExtension(trimmedPath);
        const filename = path.basename(trimmedPath);

        // Return markdown code block that will be processed by the markdown renderer
        return `\`\`\`${lang} title="${filename}"\n${fileContent.trimEnd()}\n\`\`\``;

      } else if (type === 'img') {
        const altText = path.basename(trimmedPath);
        return `![${altText}](${trimmedPath})`;

      } else if (type === 'video') {
        return `<video controls src="${trimmedPath}" style="max-width: 100%; height: auto;"></video>`;

      } else {
        console.warn(`[asset-embed] Unknown asset type: ${type}`);
        return match;
      }
    } catch (error) {
      console.error(`[asset-embed] Error processing asset: ${trimmedPath}`, error);
      return match;
    }
  });
}

// ============================================
// Type Definitions
// ============================================

export interface LoadedContent {
  // Common fields
  id: string;
  slug: string;
  content: string;

  // Frontmatter data
  data: {
    title: string;
    description?: string;
    sidebar_position?: number;
    sidebar_label?: string;
    date?: string;
    author?: string;
    tags?: string[];
    draft?: boolean;
    [key: string]: unknown;
  };

  // Metadata
  filePath: string;
  relativePath: string;
  fileType: 'mdx' | 'md' | 'yaml' | 'json';
}

export interface LoadOptions {
  // Glob pattern for files
  pattern?: string;

  // Sorting
  sort?: 'position' | 'date' | 'title' | 'alphabetical';
  order?: 'asc' | 'desc';

  // Filtering
  filter?: (content: LoadedContent) => boolean;

  // Include drafts
  includeDrafts?: boolean;

  // Depth limit
  maxDepth?: number;

  // Require XX_ prefix for position sorting (throws error if missing)
  requirePositionPrefix?: boolean;
}

export interface ContentSettings {
  sidebar?: {
    collapsed?: boolean;
    collapsible?: boolean;
    sort?: 'position' | 'alphabetical';
    depth?: number;
  };
  outline?: {
    enabled?: boolean;
    levels?: number[];
    title?: string;
  };
  pagination?: {
    enabled?: boolean;
    showPrevNext?: boolean;
  };
}

export class DataLoaderError extends Error {
  code: string;
  path: string;

  constructor({ code, path, message }: { code: string; path: string; message: string }) {
    super(message);
    this.name = 'DataLoaderError';
    this.code = code;
    this.path = path;
  }
}

// ============================================
// Cache (production only)
// ============================================

const cache = new Map<string, LoadedContent[]>();
const settingsCache = new Map<string, ContentSettings>();

function shouldUseCache(): boolean {
  return import.meta.env.PROD === true;
}

// ============================================
// File Type Detection
// ============================================

function getFileType(filePath: string): 'mdx' | 'md' | 'yaml' | 'json' | null {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.mdx':
      return 'mdx';
    case '.md':
      return 'md';
    case '.yaml':
    case '.yml':
      return 'yaml';
    case '.json':
      return 'json';
    default:
      return null;
  }
}

// ============================================
// Content Parsing
// ============================================

/**
 * Extract position from XX_ prefix in filename
 * e.g., "01_getting-started.mdx" -> { position: 1, cleanName: "getting-started" }
 */
function extractPositionFromFilename(filename: string): { position: number | null; cleanName: string } {
  const match = filename.match(/^(\d{2})_(.+)$/);
  if (match) {
    return {
      position: parseInt(match[1], 10),
      cleanName: match[2],
    };
  }
  return { position: null, cleanName: filename };
}

/**
 * Clean slug by removing XX_ prefixes from all path segments
 */
function cleanSlugPrefixes(slug: string): string {
  return slug
    .split('/')
    .map(segment => {
      const { cleanName } = extractPositionFromFilename(segment);
      return cleanName;
    })
    .join('/');
}

function parseMarkdownFile(filePath: string, basePath: string): LoadedContent {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content: rawContent } = matter(raw);
  const fileType = getFileType(filePath) as 'mdx' | 'md';

  // Process [[type, path]] asset embeds
  const fileDir = path.dirname(filePath);
  const content = processAssetEmbeds(rawContent, fileDir);

  const relativePath = path.relative(basePath, filePath);

  // Get raw slug (with potential XX_ prefixes)
  const rawSlug = relativePath
    .replace(/\\/g, '/')
    .replace(/\.(mdx|md)$/, '')
    .replace(/\/index$/, '');

  // Clean slug (remove XX_ prefixes for URL)
  const slug = cleanSlugPrefixes(rawSlug);

  // Extract position from filename if not in frontmatter
  const filename = path.basename(filePath, path.extname(filePath));
  const { position: filenamePosition } = extractPositionFromFilename(filename);

  // Frontmatter sidebar_position takes precedence, then filename prefix
  const sidebarPosition = data.sidebar_position ?? filenamePosition ?? undefined;

  return {
    id: slug.replace(/\//g, '-') || 'index',
    slug,
    content,
    data: {
      title: data.title || path.basename(filePath, path.extname(filePath)),
      ...data,
      sidebar_position: sidebarPosition,
    },
    filePath,
    relativePath,
    fileType,
  };
}

function parseYamlFile(filePath: string, basePath: string): LoadedContent {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = yaml.load(raw) as Record<string, unknown>;

  const relativePath = path.relative(basePath, filePath);
  const slug = relativePath
    .replace(/\\/g, '/')
    .replace(/\.(yaml|yml)$/, '');

  return {
    id: slug.replace(/\//g, '-'),
    slug,
    content: '',
    data: {
      title: (data.title as string) || path.basename(filePath, path.extname(filePath)),
      ...data,
    },
    filePath,
    relativePath,
    fileType: 'yaml',
  };
}

function parseJsonFile(filePath: string, basePath: string): LoadedContent {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw) as Record<string, unknown>;

  const relativePath = path.relative(basePath, filePath);
  const slug = relativePath
    .replace(/\\/g, '/')
    .replace(/\.json$/, '');

  return {
    id: slug.replace(/\//g, '-'),
    slug,
    content: '',
    data: {
      title: (data.title as string) || path.basename(filePath, '.json'),
      ...data,
    },
    filePath,
    relativePath,
    fileType: 'json',
  };
}

function parseFile(filePath: string, basePath: string): LoadedContent | null {
  const fileType = getFileType(filePath);

  switch (fileType) {
    case 'mdx':
    case 'md':
      return parseMarkdownFile(filePath, basePath);
    case 'yaml':
      return parseYamlFile(filePath, basePath);
    case 'json':
      // Skip settings.json files
      if (path.basename(filePath) === 'settings.json') {
        return null;
      }
      return parseJsonFile(filePath, basePath);
    default:
      return null;
  }
}

// ============================================
// Sorting
// ============================================

function sortContent(
  content: LoadedContent[],
  sort: LoadOptions['sort'],
  order: LoadOptions['order'] = 'asc'
): LoadedContent[] {
  const sorted = [...content].sort((a, b) => {
    let comparison = 0;

    switch (sort) {
      case 'position':
        const posA = a.data.sidebar_position ?? 999;
        const posB = b.data.sidebar_position ?? 999;
        comparison = posA - posB;
        break;

      case 'date':
        const dateA = a.data.date ? new Date(a.data.date).getTime() : 0;
        const dateB = b.data.date ? new Date(b.data.date).getTime() : 0;
        comparison = dateA - dateB;
        break;

      case 'title':
      case 'alphabetical':
        comparison = (a.data.title || '').localeCompare(b.data.title || '');
        break;

      default:
        comparison = 0;
    }

    return order === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

// ============================================
// Main Loading Functions
// ============================================

/**
 * Load content from a directory
 */
export async function loadContent(
  dataPath: string,
  options: LoadOptions = {}
): Promise<LoadedContent[]> {
  const {
    pattern = '**/*.{md,mdx}',
    sort = 'position',
    order = 'asc',
    filter,
    includeDrafts = !import.meta.env.PROD,
    maxDepth,
    requirePositionPrefix = false,
  } = options;

  // Resolve the data path
  const absolutePath = path.isAbsolute(dataPath)
    ? dataPath
    : getDataPath(dataPath);

  // Check cache
  const cacheKey = `${absolutePath}:${pattern}`;
  if (shouldUseCache() && cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // Check if directory exists
  if (!fs.existsSync(absolutePath)) {
    throw new DataLoaderError({
      code: 'DIR_NOT_FOUND',
      path: absolutePath,
      message: `Content directory not found: ${absolutePath}`,
    });
  }

  // Find files
  const files = await glob(pattern, {
    cwd: absolutePath,
    absolute: true,
    maxDepth,
  });

  // Parse files
  let content: LoadedContent[] = [];
  const missingPrefixFiles: string[] = [];

  for (const file of files) {
    const parsed = parseFile(file, absolutePath);
    if (parsed) {
      // Check for required position prefix
      if (requirePositionPrefix) {
        const filename = path.basename(file, path.extname(file));
        const hasPrefix = /^\d{2}_/.test(filename);
        if (!hasPrefix && filename !== 'index') {
          missingPrefixFiles.push(parsed.relativePath);
        }
      }
      content.push(parsed);
    }
  }

  // Throw error if prefix validation fails
  if (requirePositionPrefix && missingPrefixFiles.length > 0) {
    throw new DataLoaderError({
      code: 'MISSING_POSITION_PREFIX',
      path: absolutePath,
      message:
        `\n[DOCS ERROR] Files missing required XX_ position prefix:\n` +
        missingPrefixFiles.map(f => `  - ${f}`).join('\n') +
        `\n\nDocs files must be named with a position prefix (01-99).\n` +
        `Examples:\n` +
        `  01_getting-started.mdx\n` +
        `  02_installation.mdx\n` +
        `  guides/01_configuration.mdx\n`,
    });
  }

  // Filter drafts
  if (!includeDrafts) {
    content = content.filter((item) => !item.data.draft);
  }

  // Apply custom filter
  if (filter) {
    content = content.filter(filter);
  }

  // Sort
  content = sortContent(content, sort, order);

  // Cache
  if (shouldUseCache()) {
    cache.set(cacheKey, content);
  }

  return content;
}

/**
 * Load a single file
 */
export async function loadFile(filePath: string): Promise<LoadedContent> {
  // Resolve the file path
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : getDataPath(filePath);

  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    throw new DataLoaderError({
      code: 'FILE_NOT_FOUND',
      path: absolutePath,
      message: `Content file not found: ${absolutePath}`,
    });
  }

  const basePath = path.dirname(absolutePath);
  const parsed = parseFile(absolutePath, basePath);

  if (!parsed) {
    throw new DataLoaderError({
      code: 'UNSUPPORTED_FILE_TYPE',
      path: absolutePath,
      message: `Unsupported file type: ${absolutePath}`,
    });
  }

  return parsed;
}

/**
 * Load settings.json from a content directory
 */
export function loadSettings(dataPath: string): ContentSettings {
  const absolutePath = path.isAbsolute(dataPath)
    ? dataPath
    : getDataPath(dataPath);

  // Check cache
  if (shouldUseCache() && settingsCache.has(absolutePath)) {
    return settingsCache.get(absolutePath)!;
  }

  const settingsPath = path.join(absolutePath, 'settings.json');

  // Default settings
  const defaultSettings: ContentSettings = {
    sidebar: {
      collapsed: false,
      collapsible: true,
      sort: 'position',
      depth: 3,
    },
    outline: {
      enabled: true,
      levels: [2, 3],
      title: 'On this page',
    },
    pagination: {
      enabled: true,
      showPrevNext: true,
    },
  };

  if (!fs.existsSync(settingsPath)) {
    return defaultSettings;
  }

  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(raw) as ContentSettings;

    // Merge with defaults
    const merged: ContentSettings = {
      sidebar: { ...defaultSettings.sidebar, ...settings.sidebar },
      outline: { ...defaultSettings.outline, ...settings.outline },
      pagination: { ...defaultSettings.pagination, ...settings.pagination },
    };

    // Cache
    if (shouldUseCache()) {
      settingsCache.set(absolutePath, merged);
    }

    return merged;
  } catch (error) {
    console.error(`Error loading settings from ${settingsPath}:`, error);
    return defaultSettings;
  }
}

/**
 * Load content with settings
 */
export async function loadContentWithSettings(
  dataPath: string,
  options?: LoadOptions
): Promise<{
  content: LoadedContent[];
  settings: ContentSettings;
}> {
  const [content, settings] = await Promise.all([
    loadContent(dataPath, options),
    Promise.resolve(loadSettings(dataPath)),
  ]);

  return { content, settings };
}

export default {
  loadContent,
  loadFile,
  loadSettings,
  loadContentWithSettings,
  DataLoaderError,
};
