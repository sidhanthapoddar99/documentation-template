/**
 * XX_ prefix utilities for file/folder ordering
 */

export function parsePrefix(name: string): { prefix: number | null; baseName: string } {
  const match = name.match(/^(\d+)_(.+)$/);
  if (match) return { prefix: parseInt(match[1], 10), baseName: match[2] };
  return { prefix: null, baseName: name };
}

export function nextPrefix(existingPrefixes: number[]): number {
  if (existingPrefixes.length === 0) return 1;
  return Math.max(...existingPrefixes) + 1;
}

export function formatPrefix(n: number): string {
  return String(n).padStart(2, '0');
}

export function cleanDisplayName(name: string): string {
  const { baseName } = parsePrefix(name);
  // Remove extension, replace hyphens/underscores with spaces, title case
  const withoutExt = baseName.replace(/\.[^.]+$/, '');
  return withoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
