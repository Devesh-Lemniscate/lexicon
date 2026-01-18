// Core data types for the application

export interface Source {
  id: string;
  name: string;
  owner: string;
  repo: string;
  branch: string;
  visibility: 'public' | 'private';
  authToken?: string;
  lastSyncedAt?: number;
  createdAt: number;
}

export interface FileEntry {
  id: string; // sourceId:path
  sourceId: string;
  path: string;
  name: string;
  type: 'file' | 'folder';
  sha: string;
  size: number;
  mimeType?: string;
  parentPath: string;
}

export interface FileContent {
  id: string; // sourceId:path
  sourceId: string;
  path: string;
  content: string | Blob;
  isMarkdown: boolean;
}

export interface Bookmark {
  id: string;
  sourceId: string;
  filePath: string;
  headingId?: string;
  offsetPercent: number;
  title: string;
  snippet: string;
  createdAt: number;
}

export interface Annotation {
  id: string;
  sourceId: string;
  filePath: string;
  headingId?: string;
  paragraphIndex?: number;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface ReadingProgress {
  id: string; // sourceId:path
  sourceId: string;
  filePath: string;
  headingId?: string;
  offsetPercent: number;
  lastReadAt: number;
}

export interface SearchIndexEntry {
  id: string;
  sourceId: string;
  filePath: string;
  title: string;
  content: string;
  headings: string[];
}

export interface LastOpenedFile {
  sourceId: string;
  filePath: string;
  timestamp: number;
}

// Local folder for device files
export interface LocalFolder {
  id: string;
  name: string;
  createdAt: number;
}

// Local file from device
export interface LocalFile {
  id: string;
  folderId: string;
  name: string;
  path: string; // Virtual path within folder
  mimeType: string;
  size: number;
  content: Blob | string;
  createdAt: number;
}

// GitHub API types
export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTree {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

// Sync types
export interface SyncResult {
  success: boolean;
  added: number;
  updated: number;
  deleted: number;
  errors: string[];
}

export interface SyncProgress {
  phase: 'fetching' | 'comparing' | 'downloading' | 'indexing' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
}

// Reader settings
export interface ReaderSettings {
  fontFamily: 'inter' | 'lora' | 'merriweather' | 'source-serif' | 'nunito' | 'crimson';
  fontSize: number; // 14-24
  lineHeight: number; // 1.4-2.0
  theme: 'light' | 'dark' | 'system';
}

// Table of contents
export interface TocItem {
  id: string;
  level: number;
  text: string;
  offset: number;
}

// Todo item with scheduled reminders
export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  dueDate?: number;
  reminders: TodoReminder[];
}

export interface TodoReminder {
  id: string;
  scheduledAt: number; // timestamp
  notified: boolean;
}

// Ideas/Quick notes
export interface Idea {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

// Image annotation
export interface ImageAnnotation {
  id: string;
  sourceId: string;
  filePath: string;
  note: string;
  createdAt: number;
  updatedAt: number;
}
