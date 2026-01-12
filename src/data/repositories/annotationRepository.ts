import { getDatabase } from '../db';
import type { Annotation } from '../types';

export const annotationRepository = {
  async getAll(): Promise<Annotation[]> {
    const db = await getDatabase();
    const annotations = await db.getAll('annotations');
    return annotations.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getBySource(sourceId: string): Promise<Annotation[]> {
    const db = await getDatabase();
    return db.getAllFromIndex('annotations', 'by-source', sourceId);
  },

  async getByFile(sourceId: string, filePath: string): Promise<Annotation[]> {
    const db = await getDatabase();
    const annotations = await db.getAllFromIndex('annotations', 'by-source', sourceId);
    return annotations.filter((a) => a.filePath === filePath);
  },

  async getById(id: string): Promise<Annotation | undefined> {
    const db = await getDatabase();
    return db.get('annotations', id);
  },

  async create(annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Annotation> {
    const db = await getDatabase();
    const now = Date.now();
    const newAnnotation: Annotation = {
      ...annotation,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.put('annotations', newAnnotation);
    return newAnnotation;
  },

  async update(id: string, note: string): Promise<Annotation | undefined> {
    const db = await getDatabase();
    const existing = await db.get('annotations', id);
    if (!existing) return undefined;

    const updated: Annotation = {
      ...existing,
      note,
      updatedAt: Date.now(),
    };
    await db.put('annotations', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('annotations', id);
  },

  async deleteBySource(sourceId: string): Promise<void> {
    const db = await getDatabase();
    const annotations = await db.getAllFromIndex('annotations', 'by-source', sourceId);
    const tx = db.transaction('annotations', 'readwrite');
    for (const annotation of annotations) {
      tx.store.delete(annotation.id);
    }
    await tx.done;
  },
};
