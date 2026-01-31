/**
 * Unified Data Loader
 * Loads content using the modular parser system
 */
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { getDataPath } from './paths';
import { getParser } from '../parsers';
import {
  ParserError,
  type ContentType,
  type LoadedContent,
  type LoadOptions,
  type ContentSettings,
} from '../parsers/types';

// Re-export types from parsers for backward compatibility
export type { LoadedContent, LoadOptions, ContentSettings } from '../parsers/types';
export { ParserError as DataLoaderError } from '../parsers/types';

// ============================================
// Cache (production only)
// ============================================

const cache = new Map<string, LoadedContent[]>();
const settingsCache = new Map<string, ContentSettings>();

function shouldUseCache(): boolean {
  return import.meta.env.PROD === true;
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
  contentType: ContentType = 'docs',
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
  const cacheKey = `${absolutePath}:${pattern}:${contentType}`;
  if (shouldUseCache() && cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // Check if directory exists
  if (!fs.existsSync(absolutePath)) {
    throw new ParserError({
      code: 'DIR_NOT_FOUND',
      path: absolutePath,
      message: `Content directory not found: ${absolutePath}`,
    });
  }

  // Get parser for content type
  const parser = getParser(contentType);

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
    const parsed = await parser.parse(file, absolutePath);
    if (parsed) {
      // Check for required position prefix (docs only)
      if (requirePositionPrefix && contentType === 'docs') {
        const filename = path.basename(file, path.extname(file));
        const hasPrefix = parser.hasPositionPrefix(filename);
        if (!hasPrefix && filename !== 'index') {
          missingPrefixFiles.push(parsed.relativePath);
        }
      }
      content.push(parsed);
    }
  }

  // Throw error if prefix validation fails
  if (requirePositionPrefix && missingPrefixFiles.length > 0) {
    throw new ParserError({
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
export async function loadFile(
  filePath: string,
  contentType: ContentType = 'docs'
): Promise<LoadedContent> {
  // Resolve the file path
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : getDataPath(filePath);

  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    throw new ParserError({
      code: 'FILE_NOT_FOUND',
      path: absolutePath,
      message: `Content file not found: ${absolutePath}`,
    });
  }

  // Get parser for content type
  const parser = getParser(contentType);
  const basePath = path.dirname(absolutePath);
  const parsed = await parser.parse(absolutePath, basePath);

  if (!parsed) {
    throw new ParserError({
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
  contentType: ContentType = 'docs',
  options?: LoadOptions
): Promise<{
  content: LoadedContent[];
  settings: ContentSettings;
}> {
  const [content, settings] = await Promise.all([
    loadContent(dataPath, contentType, options),
    Promise.resolve(loadSettings(dataPath)),
  ]);

  return { content, settings };
}

export default {
  loadContent,
  loadFile,
  loadSettings,
  loadContentWithSettings,
};
