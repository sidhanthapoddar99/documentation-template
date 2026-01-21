/**
 * Sidebar Hook - Sidebar State Management
 *
 * Provides:
 * - Sidebar open/close state
 * - Mobile sidebar toggle
 * - Section expansion state
 */

const STORAGE_KEY = 'sidebar-state';
const EXPANDED_KEY = 'sidebar-expanded';

export interface SidebarState {
  isOpen: boolean;
  expandedSections: Set<string>;
}

/**
 * Get sidebar open state from localStorage
 */
export function getSidebarOpen(): boolean {
  if (typeof window === 'undefined') return true;

  const stored = localStorage.getItem(STORAGE_KEY);
  return stored !== 'closed';
}

/**
 * Set sidebar open state
 */
export function setSidebarOpen(isOpen: boolean): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEY, isOpen ? 'open' : 'closed');
  window.dispatchEvent(new CustomEvent('sidebar-change', { detail: { isOpen } }));
}

/**
 * Toggle sidebar
 */
export function toggleSidebar(): boolean {
  const current = getSidebarOpen();
  setSidebarOpen(!current);
  return !current;
}

/**
 * Get expanded sections
 */
export function getExpandedSections(): Set<string> {
  if (typeof window === 'undefined') return new Set();

  try {
    const stored = localStorage.getItem(EXPANDED_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

/**
 * Set expanded sections
 */
export function setExpandedSections(sections: Set<string>): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(EXPANDED_KEY, JSON.stringify([...sections]));
  window.dispatchEvent(new CustomEvent('sidebar-sections-change', { detail: { sections: [...sections] } }));
}

/**
 * Toggle a section's expansion state
 */
export function toggleSection(sectionId: string): boolean {
  const sections = getExpandedSections();
  const wasExpanded = sections.has(sectionId);

  if (wasExpanded) {
    sections.delete(sectionId);
  } else {
    sections.add(sectionId);
  }

  setExpandedSections(sections);
  return !wasExpanded;
}

/**
 * Check if a section is expanded
 */
export function isSectionExpanded(sectionId: string): boolean {
  return getExpandedSections().has(sectionId);
}

/**
 * Expand all sections
 */
export function expandAllSections(sectionIds: string[]): void {
  setExpandedSections(new Set(sectionIds));
}

/**
 * Collapse all sections
 */
export function collapseAllSections(): void {
  setExpandedSections(new Set());
}

/**
 * Auto-expand sections based on current path
 */
export function autoExpandForPath(currentPath: string, sectionPaths: Map<string, string>): void {
  const sections = getExpandedSections();

  for (const [sectionId, sectionPath] of sectionPaths) {
    if (currentPath.startsWith(sectionPath)) {
      sections.add(sectionId);
    }
  }

  setExpandedSections(sections);
}

/**
 * Initialize sidebar client-side script
 */
export const sidebarInitScript = `
(function() {
  // Restore sidebar state
  const sidebarOpen = localStorage.getItem('${STORAGE_KEY}') !== 'closed';
  document.documentElement.setAttribute('data-sidebar', sidebarOpen ? 'open' : 'closed');
})();
`;
