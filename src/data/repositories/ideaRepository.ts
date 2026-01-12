import { getDatabase } from '../db';
import type { Idea } from '../types';

function generateId(): string {
  return `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const ideaRepository = {
  async getAll(): Promise<Idea[]> {
    const db = await getDatabase();
    const ideas = await db.getAll('ideas');
    // Sort by most recently updated first
    return ideas.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async getById(id: string): Promise<Idea | undefined> {
    const db = await getDatabase();
    return db.get('ideas', id);
  },

  async create(data: { title: string; content: string }): Promise<Idea> {
    const db = await getDatabase();
    const now = Date.now();
    const idea: Idea = {
      id: generateId(),
      title: data.title,
      content: data.content,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('ideas', idea);
    return idea;
  },

  async update(id: string, updates: { title?: string; content?: string }): Promise<Idea | undefined> {
    const db = await getDatabase();
    const existing = await db.get('ideas', id);
    if (!existing) return undefined;

    const updated: Idea = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };
    await db.put('ideas', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('ideas', id);
  },

  async search(query: string): Promise<Idea[]> {
    const db = await getDatabase();
    const ideas = await db.getAll('ideas');
    const lowerQuery = query.toLowerCase();

    return ideas
      .filter(
        (idea) =>
          idea.title.toLowerCase().includes(lowerQuery) ||
          idea.content.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
};
