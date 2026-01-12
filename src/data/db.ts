import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
  Source,
  FileEntry,
  FileContent,
  Bookmark,
  Annotation,
  ReadingProgress,
  SearchIndexEntry,
  LastOpenedFile,
  TodoItem,
  Idea,
  ImageAnnotation,
} from './types';

const DB_NAME = 'lexicon-db';
const DB_VERSION = 2;

interface NotesReaderDB extends DBSchema {
  sources: {
    key: string;
    value: Source;
    indexes: { 'by-name': string };
  };
  files: {
    key: string;
    value: FileEntry;
    indexes: { 'by-source': string; 'by-parent': string };
  };
  fileContents: {
    key: string;
    value: FileContent;
    indexes: { 'by-source': string };
  };
  bookmarks: {
    key: string;
    value: Bookmark;
    indexes: { 'by-source': string; 'by-file': string; 'by-created': number };
  };
  annotations: {
    key: string;
    value: Annotation;
    indexes: { 'by-source': string; 'by-file': string };
  };
  readingProgress: {
    key: string;
    value: ReadingProgress;
    indexes: { 'by-source': string };
  };
  searchIndex: {
    key: string;
    value: SearchIndexEntry;
    indexes: { 'by-source': string };
  };
  lastOpened: {
    key: string;
    value: LastOpenedFile;
  };
  settings: {
    key: string;
    value: unknown;
  };
  todos: {
    key: string;
    value: TodoItem;
    indexes: { 'by-created': number; 'by-due': number };
  };
  ideas: {
    key: string;
    value: Idea;
    indexes: { 'by-created': number; 'by-updated': number };
  };
  imageAnnotations: {
    key: string;
    value: ImageAnnotation;
    indexes: { 'by-source': string; 'by-file': string };
  };
}

let dbInstance: IDBPDatabase<NotesReaderDB> | null = null;

export async function getDatabase(): Promise<IDBPDatabase<NotesReaderDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<NotesReaderDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Sources store
      if (!db.objectStoreNames.contains('sources')) {
        const sourcesStore = db.createObjectStore('sources', { keyPath: 'id' });
        sourcesStore.createIndex('by-name', 'name');
      }

      // Files store
      if (!db.objectStoreNames.contains('files')) {
        const filesStore = db.createObjectStore('files', { keyPath: 'id' });
        filesStore.createIndex('by-source', 'sourceId');
        filesStore.createIndex('by-parent', 'parentPath');
      }

      // File contents store
      if (!db.objectStoreNames.contains('fileContents')) {
        const contentsStore = db.createObjectStore('fileContents', { keyPath: 'id' });
        contentsStore.createIndex('by-source', 'sourceId');
      }

      // Bookmarks store
      if (!db.objectStoreNames.contains('bookmarks')) {
        const bookmarksStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
        bookmarksStore.createIndex('by-source', 'sourceId');
        bookmarksStore.createIndex('by-file', 'filePath');
        bookmarksStore.createIndex('by-created', 'createdAt');
      }

      // Annotations store
      if (!db.objectStoreNames.contains('annotations')) {
        const annotationsStore = db.createObjectStore('annotations', { keyPath: 'id' });
        annotationsStore.createIndex('by-source', 'sourceId');
        annotationsStore.createIndex('by-file', 'filePath');
      }

      // Reading progress store
      if (!db.objectStoreNames.contains('readingProgress')) {
        const progressStore = db.createObjectStore('readingProgress', { keyPath: 'id' });
        progressStore.createIndex('by-source', 'sourceId');
      }

      // Search index store
      if (!db.objectStoreNames.contains('searchIndex')) {
        const searchStore = db.createObjectStore('searchIndex', { keyPath: 'id' });
        searchStore.createIndex('by-source', 'sourceId');
      }

      // Last opened store
      if (!db.objectStoreNames.contains('lastOpened')) {
        db.createObjectStore('lastOpened', { keyPath: 'sourceId' });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Todos store
      if (!db.objectStoreNames.contains('todos')) {
        const todosStore = db.createObjectStore('todos', { keyPath: 'id' });
        todosStore.createIndex('by-created', 'createdAt');
        todosStore.createIndex('by-due', 'dueDate');
      }

      // Ideas store
      if (!db.objectStoreNames.contains('ideas')) {
        const ideasStore = db.createObjectStore('ideas', { keyPath: 'id' });
        ideasStore.createIndex('by-created', 'createdAt');
        ideasStore.createIndex('by-updated', 'updatedAt');
      }

      // Image annotations store
      if (!db.objectStoreNames.contains('imageAnnotations')) {
        const imgAnnotationsStore = db.createObjectStore('imageAnnotations', { keyPath: 'id' });
        imgAnnotationsStore.createIndex('by-source', 'sourceId');
        imgAnnotationsStore.createIndex('by-file', 'filePath');
      }
    },
  });

  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
