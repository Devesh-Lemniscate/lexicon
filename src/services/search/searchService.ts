import Fuse, { IFuseOptions } from 'fuse.js';
import type { SearchIndexEntry } from '@/data/types';
import { searchIndexRepository } from '@/data/repositories';

export interface SearchResult {
  sourceId: string;
  filePath: string;
  title: string;
  snippet: string;
  matches: Array<{
    key: string;
    indices: readonly [number, number][];
  }>;
  score: number;
}

let fuseInstance: Fuse<SearchIndexEntry> | null = null;
let cachedEntries: SearchIndexEntry[] = [];

const FUSE_OPTIONS: IFuseOptions<SearchIndexEntry> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'headings', weight: 0.3 },
    { name: 'content', weight: 0.3 },
  ],
  includeScore: true,
  includeMatches: true,
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
  findAllMatches: true,
};

export const searchService = {
  /**
   * Initialize or refresh the search index
   */
  async initialize(): Promise<void> {
    cachedEntries = await searchIndexRepository.getAll();
    fuseInstance = new Fuse(cachedEntries, FUSE_OPTIONS);
  },

  /**
   * Search across all indexed content
   */
  async search(query: string, limit = 50): Promise<SearchResult[]> {
    if (!fuseInstance) {
      await this.initialize();
    }

    if (!query.trim()) {
      return [];
    }

    const results = fuseInstance!.search(query, { limit });

    return results.map((result) => ({
      sourceId: result.item.sourceId,
      filePath: result.item.filePath,
      title: result.item.title,
      snippet: this.createSnippet(result.item.content, query),
      matches: (result.matches || []).map((m) => ({
        key: m.key || '',
        indices: m.indices as [number, number][],
      })),
      score: result.score || 0,
    }));
  },

  /**
   * Search within a specific source
   */
  async searchInSource(query: string, sourceId: string, limit = 50): Promise<SearchResult[]> {
    const results = await this.search(query, limit * 2);
    return results.filter((r) => r.sourceId === sourceId).slice(0, limit);
  },

  /**
   * Create a snippet around the matched text
   */
  createSnippet(content: string, query: string, snippetLength = 150): string {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    if (index === -1) {
      // No direct match, return start of content
      return content.slice(0, snippetLength) + (content.length > snippetLength ? '...' : '');
    }

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 100);

    let snippet = content.slice(start, end);

    if (start > 0) {
      snippet = '...' + snippet;
    }
    if (end < content.length) {
      snippet = snippet + '...';
    }

    return snippet;
  },

  /**
   * Invalidate the search index cache
   */
  invalidate(): void {
    fuseInstance = null;
    cachedEntries = [];
  },

  /**
   * Add or update entries in the index
   */
  async updateIndex(entries: SearchIndexEntry[]): Promise<void> {
    // Update in database
    for (const entry of entries) {
      await searchIndexRepository.upsert(entry);
    }
    // Refresh in-memory index
    await this.initialize();
  },

  /**
   * Remove entries from the index
   */
  async removeFromIndex(sourceId: string, filePaths: string[]): Promise<void> {
    for (const path of filePaths) {
      await searchIndexRepository.delete(sourceId, path);
    }
    // Refresh in-memory index
    await this.initialize();
  },
};
