/**
 * Hooks - Client-side utilities for Astro components
 *
 * These hooks provide state management and utilities that work
 * in both Astro components (server-side) and client scripts.
 */

// Theme management
export {
  type Theme,
  getTheme,
  getResolvedTheme,
  setTheme,
  toggleTheme,
  initTheme,
  themeInitScript,
} from './useTheme';

// Navigation management
export {
  type PageTag,
  type NavItem,
  type NavSection,
  defaultPageRegistry,
  getSortedNavItems,
  getItemsByTag,
  isActivePath,
  getBreadcrumbs,
  flattenNavItems,
  getPrevNextItems,
  groupByTag,
} from './useNavigation';

// Sidebar management
export {
  type SidebarState,
  getSidebarOpen,
  setSidebarOpen,
  toggleSidebar,
  getExpandedSections,
  setExpandedSections,
  toggleSection,
  isSectionExpanded,
  expandAllSections,
  collapseAllSections,
  autoExpandForPath,
  sidebarInitScript,
} from './useSidebar';

// Table of Contents
export {
  type TOCItem,
  extractHeadings,
  buildNestedTOC,
  generateHeadingId,
  scrollToHeading,
  getActiveHeading,
  createHeadingObserver,
  tocInitScript,
} from './useTableOfContents';
