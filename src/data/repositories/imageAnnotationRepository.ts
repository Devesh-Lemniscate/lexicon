import { getDatabase } from '../db';
import type { ImageAnnotation } from '../types';

function generateId(): string {
  return `imgann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const imageAnnotationRepository = {
  async getByFile(sourceId: string, filePath: string): Promise<ImageAnnotation | undefined> {
    const db = await getDatabase();
    const all = await db.getAllFromIndex('imageAnnotations', 'by-file', filePath);
    return all.find((a) => a.sourceId === sourceId);
  },

  async create(data: Omit<ImageAnnotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ImageAnnotation> {
    const db = await getDatabase();
    const now = Date.now();
    const annotation: ImageAnnotation = {
      id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('imageAnnotations', annotation);
    return annotation;
  },

  async update(id: string, note: string): Promise<ImageAnnotation | undefined> {
    const db = await getDatabase();
    const existing = await db.get('imageAnnotations', id);
    if (!existing) return undefined;

    const updated: ImageAnnotation = {
      ...existing,
      note,
      updatedAt: Date.now(),
    };
    await db.put('imageAnnotations', updated);
    return updated;
  },

  async upsert(sourceId: string, filePath: string, note: string): Promise<ImageAnnotation> {
    const existing = await this.getByFile(sourceId, filePath);
    if (existing) {
      return (await this.update(existing.id, note))!;
    }
    return this.create({ sourceId, filePath, note });
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('imageAnnotations', id);
  },

  async deleteBySource(sourceId: string): Promise<void> {
    const db = await getDatabase();
    const all = await db.getAllFromIndex('imageAnnotations', 'by-source', sourceId);
    for (const annotation of all) {
      await db.delete('imageAnnotations', annotation.id);
    }
  },
};
