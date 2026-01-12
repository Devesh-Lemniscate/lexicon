import { getDatabase } from '../db';
import type { Source } from '../types';

export const sourceRepository = {
  async getAll(): Promise<Source[]> {
    const db = await getDatabase();
    return db.getAll('sources');
  },

  async getById(id: string): Promise<Source | undefined> {
    const db = await getDatabase();
    return db.get('sources', id);
  },

  async create(source: Omit<Source, 'id' | 'createdAt'>): Promise<Source> {
    const db = await getDatabase();
    const newSource: Source = {
      ...source,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    await db.put('sources', newSource);
    return newSource;
  },

  async update(id: string, updates: Partial<Source>): Promise<Source | undefined> {
    const db = await getDatabase();
    const existing = await db.get('sources', id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    await db.put('sources', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('sources', id);
  },

  async updateLastSynced(id: string): Promise<void> {
    const db = await getDatabase();
    const source = await db.get('sources', id);
    if (source) {
      source.lastSyncedAt = Date.now();
      await db.put('sources', source);
    }
  },
};
