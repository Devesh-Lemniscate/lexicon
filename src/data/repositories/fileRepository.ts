import { getDatabase } from '../db';
import type { FileEntry, FileContent } from '../types';
import { localFilesRepository } from './localFilesRepository';

export const fileRepository = {
  async getBySource(sourceId: string): Promise<FileEntry[]> {
    const db = await getDatabase();
    return db.getAllFromIndex('files', 'by-source', sourceId);
  },

  async getByParent(sourceId: string, parentPath: string): Promise<FileEntry[]> {
    const db = await getDatabase();
    const allFiles = await db.getAllFromIndex('files', 'by-source', sourceId);
    return allFiles.filter((f) => f.parentPath === parentPath);
  },

  async getByPath(sourceId: string, path: string): Promise<FileEntry | undefined> {
    const db = await getDatabase();
    const id = `${sourceId}:${path}`;
    return db.get('files', id);
  },

  async upsert(file: Omit<FileEntry, 'id'>): Promise<FileEntry> {
    const db = await getDatabase();
    const entry: FileEntry = {
      ...file,
      id: `${file.sourceId}:${file.path}`,
    };
    await db.put('files', entry);
    return entry;
  },

  async upsertMany(files: Omit<FileEntry, 'id'>[]): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction('files', 'readwrite');
    for (const file of files) {
      const entry: FileEntry = {
        ...file,
        id: `${file.sourceId}:${file.path}`,
      };
      tx.store.put(entry);
    }
    await tx.done;
  },

  async delete(sourceId: string, path: string): Promise<void> {
    const db = await getDatabase();
    const id = `${sourceId}:${path}`;
    await db.delete('files', id);
  },

  async deleteBySource(sourceId: string): Promise<void> {
    const db = await getDatabase();
    const files = await db.getAllFromIndex('files', 'by-source', sourceId);
    const tx = db.transaction('files', 'readwrite');
    for (const file of files) {
      tx.store.delete(file.id);
    }
    await tx.done;
  },

  async getContent(sourceId: string, path: string): Promise<FileContent | undefined> {
    // Handle local files from LocalFilesScreen (format: local:folderId)
    if (sourceId.startsWith('local:')) {
      const localFile = await localFilesRepository.getFile(path);
      if (!localFile) return undefined;
      
      const isMarkdown = localFile.name.toLowerCase().endsWith('.md');
      let content = localFile.content;
      
      // If it's markdown and stored as blob, convert to string
      if (isMarkdown && content instanceof Blob) {
        content = await content.text();
      }
      
      return {
        id: `${sourceId}:${path}`,
        sourceId,
        path,
        content,
        isMarkdown,
      };
    }
    
    // Handle local files from Settings page (format: local) - stored in fileContents
    if (sourceId === 'local') {
      const db = await getDatabase();
      const id = `${sourceId}:${path}`;
      return db.get('fileContents', id);
    }
    
    // Handle GitHub sources
    const db = await getDatabase();
    const id = `${sourceId}:${path}`;
    return db.get('fileContents', id);
  },

  async saveContent(content: Omit<FileContent, 'id'>): Promise<void> {
    const db = await getDatabase();
    const entry: FileContent = {
      ...content,
      id: `${content.sourceId}:${content.path}`,
    };
    await db.put('fileContents', entry);
  },

  async saveContentMany(contents: Omit<FileContent, 'id'>[]): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction('fileContents', 'readwrite');
    for (const content of contents) {
      const entry: FileContent = {
        ...content,
        id: `${content.sourceId}:${content.path}`,
      };
      tx.store.put(entry);
    }
    await tx.done;
  },

  async deleteContent(sourceId: string, path: string): Promise<void> {
    const db = await getDatabase();
    const id = `${sourceId}:${path}`;
    await db.delete('fileContents', id);
  },

  async deleteContentBySource(sourceId: string): Promise<void> {
    const db = await getDatabase();
    const contents = await db.getAllFromIndex('fileContents', 'by-source', sourceId);
    const tx = db.transaction('fileContents', 'readwrite');
    for (const content of contents) {
      tx.store.delete(content.id);
    }
    await tx.done;
  },

  async getMarkdownFiles(sourceId: string): Promise<FileEntry[]> {
    const files = await this.getBySource(sourceId);
    return files.filter((f) => f.type === 'file' && f.path.endsWith('.md'));
  },
};
