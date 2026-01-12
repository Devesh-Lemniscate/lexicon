import { getDatabase } from '../db';
import type { ReadingProgress, LastOpenedFile } from '../types';

export const readingProgressRepository = {
  async get(sourceId: string, filePath: string): Promise<ReadingProgress | undefined> {
    const db = await getDatabase();
    const id = `${sourceId}:${filePath}`;
    return db.get('readingProgress', id);
  },

  async save(progress: Omit<ReadingProgress, 'id'>): Promise<ReadingProgress> {
    const db = await getDatabase();
    const entry: ReadingProgress = {
      ...progress,
      id: `${progress.sourceId}:${progress.filePath}`,
    };
    await db.put('readingProgress', entry);
    return entry;
  },

  async delete(sourceId: string, filePath: string): Promise<void> {
    const db = await getDatabase();
    const id = `${sourceId}:${filePath}`;
    await db.delete('readingProgress', id);
  },

  async deleteBySource(sourceId: string): Promise<void> {
    const db = await getDatabase();
    const progress = await db.getAllFromIndex('readingProgress', 'by-source', sourceId);
    const tx = db.transaction('readingProgress', 'readwrite');
    for (const p of progress) {
      tx.store.delete(p.id);
    }
    await tx.done;
  },

  async getLastOpened(sourceId: string): Promise<LastOpenedFile | undefined> {
    const db = await getDatabase();
    return db.get('lastOpened', sourceId);
  },

  async setLastOpened(sourceId: string, filePath: string): Promise<void> {
    const db = await getDatabase();
    await db.put('lastOpened', {
      sourceId,
      filePath,
      timestamp: Date.now(),
    });
  },
};
