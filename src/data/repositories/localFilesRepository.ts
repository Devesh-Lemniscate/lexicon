import { getDatabase } from '../db';
import type { LocalFolder, LocalFile } from '../types';

export const localFilesRepository = {
  // Folder operations
  async getAllFolders(): Promise<LocalFolder[]> {
    const db = await getDatabase();
    const folders = await db.getAll('localFolders');
    return folders.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getFolder(id: string): Promise<LocalFolder | undefined> {
    const db = await getDatabase();
    return db.get('localFolders', id);
  },

  async createFolder(name: string): Promise<LocalFolder> {
    const db = await getDatabase();
    const folder: LocalFolder = {
      id: `local-folder-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      createdAt: Date.now(),
    };
    await db.put('localFolders', folder);
    return folder;
  },

  async updateFolder(id: string, name: string): Promise<LocalFolder | undefined> {
    const db = await getDatabase();
    const folder = await db.get('localFolders', id);
    if (!folder) return undefined;

    const updated = { ...folder, name };
    await db.put('localFolders', updated);
    return updated;
  },

  async deleteFolder(id: string): Promise<void> {
    const db = await getDatabase();
    // Delete all files in folder first
    const files = await db.getAllFromIndex('localFiles', 'by-folder', id);
    const tx = db.transaction('localFiles', 'readwrite');
    for (const file of files) {
      tx.store.delete(file.id);
    }
    await tx.done;
    // Delete folder
    await db.delete('localFolders', id);
  },

  // File operations
  async getFilesByFolder(folderId: string): Promise<LocalFile[]> {
    const db = await getDatabase();
    return db.getAllFromIndex('localFiles', 'by-folder', folderId);
  },

  async getFile(id: string): Promise<LocalFile | undefined> {
    const db = await getDatabase();
    return db.get('localFiles', id);
  },

  async addFile(folderId: string, file: File): Promise<LocalFile> {
    const db = await getDatabase();
    
    const content = await file.arrayBuffer();
    const blob = new Blob([content], { type: file.type });
    
    const localFile: LocalFile = {
      id: `local-file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      folderId,
      name: file.name,
      path: file.name,
      mimeType: file.type || getMimeTypeFromName(file.name),
      size: file.size,
      content: blob,
      createdAt: Date.now(),
    };
    
    await db.put('localFiles', localFile);
    return localFile;
  },

  async addFiles(folderId: string, files: FileList): Promise<LocalFile[]> {
    const results: LocalFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const added = await this.addFile(folderId, file);
      results.push(added);
    }
    return results;
  },

  async deleteFile(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('localFiles', id);
  },

  async getFileContent(id: string): Promise<{ content: Blob | string; mimeType: string } | undefined> {
    const db = await getDatabase();
    const file = await db.get('localFiles', id);
    if (!file) return undefined;
    return { content: file.content, mimeType: file.mimeType };
  },
};

function getMimeTypeFromName(name: string): string {
  const ext = name.toLowerCase().split('.').pop();
  switch (ext) {
    case 'md':
      return 'text/markdown';
    case 'txt':
      return 'text/plain';
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'json':
      return 'application/json';
    case 'yaml':
    case 'yml':
      return 'text/yaml';
    case 'xml':
      return 'application/xml';
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'csv':
      return 'text/csv';
    default:
      return 'application/octet-stream';
  }
}
