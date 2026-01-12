import { getDatabase } from '../db';
import type { SearchIndexEntry } from '../types';

export const searchIndexRepository = {
  async getAll(): Promise<SearchIndexEntry[]> {
    const db = await getDatabase();
    return db.getAll('searchIndex');
  },

  async getBySource(sourceId: string): Promise<SearchIndexEntry[]> {
    const db = await getDatabase();
    return db.getAllFromIndex('searchIndex', 'by-source', sourceId);
  },

  async upsert(entry: Omit<SearchIndexEntry, 'id'>): Promise<SearchIndexEntry> {
    const db = await getDatabase();
    const indexEntry: SearchIndexEntry = {
      ...entry,
      id: `${entry.sourceId}:${entry.filePath}`,
    };
    await db.put('searchIndex', indexEntry);
    return indexEntry;
  },

  async upsertMany(entries: Omit<SearchIndexEntry, 'id'>[]): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction('searchIndex', 'readwrite');
    for (const entry of entries) {
      const indexEntry: SearchIndexEntry = {
        ...entry,
        id: `${entry.sourceId}:${entry.filePath}`,
      };
      tx.store.put(indexEntry);
    }
    await tx.done;
  },

  async delete(sourceId: string, filePath: string): Promise<void> {
    const db = await getDatabase();
    const id = `${sourceId}:${filePath}`;
    await db.delete('searchIndex', id);
  },

  async deleteBySource(sourceId: string): Promise<void> {
    const db = await getDatabase();
    const entries = await db.getAllFromIndex('searchIndex', 'by-source', sourceId);
    const tx = db.transaction('searchIndex', 'readwrite');
    for (const entry of entries) {
      tx.store.delete(entry.id);
    }
    await tx.done;
  },
};
