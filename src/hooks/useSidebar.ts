/**
 * Sidebar Hook - Build sidebar tree from content
 *
 * Sorting: XX_ prefix is the SOLE determining factor for order
 * Both files and folders use the same XX_ prefix system
 *
 * Caching: Sidebar tree is cached using globalThis for persistence across requests
 */

import fs from 'fs';
import path from 'path';
import type { LoadedContent } from '@loaders/data';

// ============================================
// Cache Keys (defined early for invalidation function)
// ============================================

const SIDEBAR_CACHE_KEY = '__astro_sidebar_cache__';
const FOLDER_SETTINGS_CACHE_KEY = '__astro_folder_settings_cache__';
const FOLDER_LOOKUP_CACHE_KEY = '__astro_folder_lookup_cache__';

// ============================================
// Sidebar Cache (using globalThis)
// ============================================

interface SidebarCacheEntry {
  nodes: SidebarNode[];
  timestamp: number;
  contentLength: number; // Quick check before deep comparison
  contentSlugs: Set<string>; // For fast lookup
}

function getSidebarCache(): Map<string, SidebarCacheEntry> {
  if (!(globalThis as any)[SIDEBAR_CACHE_KEY]) {
    console.log('[SIDEBAR CACHE] Initializing new cache');
    (globalThis as any)[SIDEBAR_CACHE_KEY] = new Map<string, SidebarCacheEntry>();
  }
  return (globalThis as any)[SIDEBAR_CACHE_KEY];
}

/**
 * Invalidate all sidebar caches (called on file add/delete/change)
 */
export function invalidateSidebarCache(): void {
  // Clear sidebar tree cache
  if ((globalThis as any)[SIDEBAR_CACHE_KEY]) {
    (globalThis as any)[SIDEBAR_CACHE_KEY].clear();
    console.log('[SIDEBAR CACHE] Invalidated');
  }
  // Clear folder settings cache
  if ((globalThis as any)[FOLDER_SETTINGS_CACHE_KEY]) {
    (globalThis as any)[FOLDER_SETTINGS_CACHE_KEY].clear();
  }
  // Clear folder lookup cache
  if ((globalThis as any)[FOLDER_LOOKUP_CACHE_KEY]) {
    (globalThis as any)[FOLDER_LOOKUP_CACHE_KEY].clear();
  }
}

/**
 * Quick cache validation - checks if content matches cached state
 */
function isCacheValid(cached: SidebarCacheEntry, content: LoadedContent[]): boolean {
  // Quick length check first (O(1))
  if (cached.contentLength !== content.length) {
    return false;
  }
  // Check all slugs match (O(n) but with Set lookup)
  for (const item of content) {
    if (!cached.contentSlugs.has(item.slug)) {
      return false;
    }
  }
  return true;
}

// ============================================
// Types
// ============================================

export interface SidebarItem {
  type: 'item';
  title: string;
  href: string;
  slug: string;
  position: number;
}

export interface SidebarSection {
  type: 'section';
  title: string;
  slug: string;
  href?: string;
  position: number;
  collapsed: boolean;
  collapsible: boolean;
  children: (SidebarItem | SidebarSection)[];
}

export type SidebarNode = SidebarItem | SidebarSection;

export interface FolderSettings {
  label?: string;
  isCollapsible?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
}

// ============================================
// Utilities
// ============================================

/**
 * Extract position from XX_ prefix (works for files and folders)
 */
function extractPosition(name: string): { position: number; cleanName: string } {
  const match = name.match(/^(\d{2})_(.+)$/);
  if (match) {
    return {
      position: parseInt(match[1], 10),
      cleanName: match[2],
    };
  }
  return { position: 999, cleanName: name };
}

// Folder settings cache
function getFolderSettingsCache(): Map<string, FolderSettings> {
  if (!(globalThis as any)[FOLDER_SETTINGS_CACHE_KEY]) {
    (globalThis as any)[FOLDER_SETTINGS_CACHE_KEY] = new Map<string, FolderSettings>();
  }
  return (globalThis as any)[FOLDER_SETTINGS_CACHE_KEY];
}

/**
 * Load settings.json from a folder (cached)
 */
function loadFolderSettings(folderPath: string): FolderSettings {
  // Check cache first
  const cache = getFolderSettingsCache();
  if (cache.has(folderPath)) {
    return cache.get(folderPath)!;
  }

  const settingsPath = path.join(folderPath, 'settings.json');

  if (!fs.existsSync(settingsPath)) {
    cache.set(folderPath, {});
    return {};
  }

  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(raw) as FolderSettings;
    cache.set(folderPath, settings);
    return settings;
  } catch {
    cache.set(folderPath, {});
    return {};
  }
}

/**
 * Format a slug into a readable title
 */
function formatTitle(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Folder lookup cache (parent path -> map of clean names to actual folder names)
function getFolderLookupCache(): Map<string, Map<string, string>> {
  if (!(globalThis as any)[FOLDER_LOOKUP_CACHE_KEY]) {
    (globalThis as any)[FOLDER_LOOKUP_CACHE_KEY] = new Map<string, Map<string, string>>();
  }
  return (globalThis as any)[FOLDER_LOOKUP_CACHE_KEY];
}

/**
 * Find folder with XX_ prefix that matches clean name (cached)
 */
function findFolderWithPrefix(parentPath: string, cleanName: string): string | null {
  if (!parentPath) {
    return null;
  }

  const cache = getFolderLookupCache();

  // Check if we have cached folder mappings for this parent
  if (!cache.has(parentPath)) {
    // Build mapping for this parent directory
    const folderMap = new Map<string, string>();

    if (fs.existsSync(parentPath)) {
      try {
        const entries = fs.readdirSync(parentPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const { cleanName: entryClean } = extractPosition(entry.name);
            folderMap.set(entryClean, entry.name);
          }
        }
      } catch {
        // Ignore errors
      }
    }

    cache.set(parentPath, folderMap);
  }

  return cache.get(parentPath)?.get(cleanName) || null;
}

// ============================================
// Sidebar Tree Building
// ============================================

interface TreeNode {
  name: string;
  cleanName: string;
  fullPath: string;  // filesystem path
  slugPath: string;  // url slug path
  position: number;
  settings: FolderSettings;
  items: LoadedContent[];
  children: Map<string, TreeNode>;
}

/**
 * Build a sidebar tree from flat content array
 * Sorting is based ONLY on XX_ prefix
 *
 * Returns mixed array: root-level files become items, folders become sections
 * Results are cached for performance
 */
export function buildSidebarTree(
  content: LoadedContent[],
  basePath: string = '/docs',
  dataPath?: string
): SidebarNode[] {
  // Generate cache key
  const cacheKey = `${dataPath || 'default'}:${basePath}`;

  // Check cache first (before any expensive operations)
  const cache = getSidebarCache();
  const cached = cache.get(cacheKey);

  if (cached && isCacheValid(cached, content)) {
    console.log(`[SIDEBAR CACHE HIT] ${cacheKey}`);
    return cached.nodes;
  }

  console.log(`[SIDEBAR CACHE MISS] ${cacheKey}`);

  const root: Map<string, TreeNode> = new Map();
  const rootItems: LoadedContent[] = []; // Root-level files (no folder)

  // Group content by directory structure
  for (const item of content) {
    const parts = item.slug.split('/');
    let currentLevel = root;
    let currentFsPath = dataPath || '';

    // Navigate/create the tree structure for directories
    for (let i = 0; i < parts.length - 1; i++) {
      const slugPart = parts[i];

      if (!currentLevel.has(slugPart)) {
        // Find the actual folder name (with XX_ prefix)
        const actualFolderName = findFolderWithPrefix(currentFsPath, slugPart) || slugPart;
        const { position } = extractPosition(actualFolderName);
        const folderFsPath = path.join(currentFsPath, actualFolderName);
        const settings = dataPath ? loadFolderSettings(folderFsPath) : {};

        currentLevel.set(slugPart, {
          name: actualFolderName,
          cleanName: slugPart,
          fullPath: folderFsPath,
          slugPath: parts.slice(0, i + 1).join('/'),
          position,
          settings,
          items: [],
          children: new Map(),
        });
      }

      const node = currentLevel.get(slugPart)!;
      currentFsPath = node.fullPath;
      currentLevel = node.children;
    }

    // Add item to appropriate level
    if (parts.length === 1) {
      // Top-level file - collect as direct items
      rootItems.push(item);
    } else {
      // Add to parent folder
      const parentSlug = parts.slice(0, -1).join('/');
      const parent = findNode(root, parentSlug);
      if (parent) {
        parent.items.push(item);
      }
    }
  }

  // Build result: mix of items (root files) and sections (folders)
  const result: SidebarNode[] = [];

  // Add root-level items directly
  for (const item of rootItems) {
    result.push({
      type: 'item',
      title: item.data.sidebar_label || item.data.title,
      href: `${basePath}/${item.slug}`,
      slug: item.slug,
      position: item.data.sidebar_position ?? 999,
    });
  }

  // Add folder sections
  for (const [, node] of root) {
    result.push(nodeToSection(node, basePath));
  }

  // Sort everything by position
  const sortedResult = result.sort((a, b) => a.position - b.position);

  // Cache the result
  cache.set(cacheKey, {
    nodes: sortedResult,
    timestamp: Date.now(),
    contentLength: content.length,
    contentSlugs: new Set(content.map(c => c.slug)),
  });
  console.log(`[SIDEBAR CACHE SET] ${cacheKey} - ${sortedResult.length} nodes`);

  return sortedResult;
}

/**
 * Find a node in the tree by slug path
 */
function findNode(root: Map<string, TreeNode>, slugPath: string): TreeNode | null {
  const parts = slugPath.split('/');
  let current = root;

  for (let i = 0; i < parts.length; i++) {
    const node = current.get(parts[i]);
    if (!node) return null;
    if (i === parts.length - 1) return node;
    current = node.children;
  }

  return null;
}

/**
 * Convert a single tree node to sidebar section
 */
function nodeToSection(node: TreeNode, basePath: string): SidebarSection {
  const settings = node.settings;
  const children: (SidebarItem | SidebarSection)[] = [];

  // Convert items to SidebarItems
  for (const item of node.items) {
    children.push({
      type: 'item',
      title: item.data.sidebar_label || item.data.title,
      href: `${basePath}/${item.slug}`,
      slug: item.slug,
      position: item.data.sidebar_position ?? 999,
    });
  }

  // Convert child folders to nested SidebarSections
  for (const [, childNode] of node.children) {
    children.push(nodeToSection(childNode, basePath));
  }

  // Sort ALL children by position
  children.sort((a, b) => a.position - b.position);

  // Section href is the first item's href
  let sectionHref: string | undefined;
  const firstItem = children.find((c): c is SidebarItem => c.type === 'item');
  if (firstItem) {
    sectionHref = firstItem.href;
  }

  // Determine collapsibility - check both isCollapsible and collapsible
  const isCollapsible = settings.isCollapsible ?? settings.collapsible ?? true;

  return {
    type: 'section',
    title: settings.label || formatTitle(node.cleanName),
    slug: node.slugPath,
    href: sectionHref,
    position: node.position,
    collapsed: settings.collapsed ?? false,
    collapsible: isCollapsible,
    children,
  };
}

// ============================================
// Navigation Helpers
// ============================================

/**
 * Check if a section contains the current path
 */
export function isSectionActive(section: SidebarSection, currentPath: string): boolean {
  if (section.href === currentPath) return true;

  for (const child of section.children) {
    if (child.type === 'item' && child.href === currentPath) {
      return true;
    }
    if (child.type === 'section' && isSectionActive(child, currentPath)) {
      return true;
    }
  }

  return false;
}

/**
 * Flatten sidebar to linear list for pagination
 */
function flattenSidebar(nodes: SidebarNode[]): SidebarItem[] {
  const result: SidebarItem[] = [];

  for (const node of nodes) {
    if (node.type === 'item') {
      result.push(node);
    } else {
      // Recursively add children (items come from sections)
      result.push(...flattenSidebar(node.children));
    }
  }

  return result;
}

/**
 * Get previous and next items for pagination
 */
export function getPrevNext(
  nodes: SidebarNode[],
  currentPath: string
): { prev: SidebarItem | null; next: SidebarItem | null } {
  const flatItems = flattenSidebar(nodes);
  const currentIndex = flatItems.findIndex(item => item.href === currentPath);

  return {
    prev: currentIndex > 0 ? flatItems[currentIndex - 1] : null,
    next: currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : null,
  };
}

export default {
  buildSidebarTree,
  isSectionActive,
  getPrevNext,
};
