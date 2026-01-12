/**
 * Get parent path from a file path
 */
export function getParentPath(path: string): string {
  const parts = path.split('/');
  return parts.slice(0, -1).join('/');
}

/**
 * Get filename from a path
 */
export function getFileName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

/**
 * Get file extension
 */
export function getExtension(path: string): string {
  const fileName = getFileName(path);
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex !== -1 ? fileName.slice(dotIndex).toLowerCase() : '';
}

/**
 * Check if path is a markdown file
 */
export function isMarkdownFile(path: string): boolean {
  return getExtension(path) === '.md';
}

/**
 * Check if path is an image file
 */
export function isImageFile(path: string): boolean {
  const ext = getExtension(path);
  return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number | undefined): string {
  if (!timestamp) return 'Never synced';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Sort files with folders first, then alphabetically
 */
export function sortFilesAndFolders<T extends { type: 'file' | 'folder'; name: string }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    // Folders first
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    // Alphabetical within same type
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

/**
 * Build breadcrumb path from file path
 */
export function buildBreadcrumbs(path: string): Array<{ name: string; path: string }> {
  const parts = path.split('/').filter(Boolean);
  const breadcrumbs: Array<{ name: string; path: string }> = [];

  let currentPath = '';
  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    breadcrumbs.push({ name: part, path: currentPath });
  }

  return breadcrumbs;
}
