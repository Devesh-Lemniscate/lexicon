import { getDatabase } from '../db';
import type { Bookmark } from '../types';

export const bookmarkRepository = {
  async getAll(): Promise<Bookmark[]> {
    const db = await getDatabase();
    const bookmarks = await db.getAll('bookmarks');
    return bookmarks.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getBySource(sourceId: string): Promise<Bookmark[]> {
    const db = await getDatabase();
    const bookmarks = await db.getAllFromIndex('bookmarks', 'by-source', sourceId);
    return bookmarks.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getByFile(sourceId: string, filePath: string): Promise<Bookmark[]> {
    const db = await getDatabase();
    const bookmarks = await db.getAllFromIndex('bookmarks', 'by-source', sourceId);
    return bookmarks
      .filter((b) => b.filePath === filePath)
      .sort((a, b) => a.offsetPercent - b.offsetPercent);
  },

  async create(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark> {
    const db = await getDatabase();
    const newBookmark: Bookmark = {
      ...bookmark,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    await db.put('bookmarks', newBookmark);
    return newBookmark;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('bookmarks', id);
  },

  async deleteBySource(sourceId: string): Promise<void> {
    const db = await getDatabase();
    const bookmarks = await db.getAllFromIndex('bookmarks', 'by-source', sourceId);
    const tx = db.transaction('bookmarks', 'readwrite');
    for (const bookmark of bookmarks) {
      tx.store.delete(bookmark.id);
    }
    await tx.done;
  },

  async exists(sourceId: string, filePath: string, headingId?: string): Promise<boolean> {
    const bookmarks = await this.getByFile(sourceId, filePath);
    return bookmarks.some((b) => b.headingId === headingId);
  },
};
