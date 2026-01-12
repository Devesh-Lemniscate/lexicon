import { getDatabase } from '../db';
import type { ReaderSettings } from '../types';

const DEFAULT_SETTINGS: ReaderSettings = {
  fontFamily: 'inter',
  fontSize: 18,
  lineHeight: 1.7,
  theme: 'system',
};

export const settingsRepository = {
  async getReaderSettings(): Promise<ReaderSettings> {
    const db = await getDatabase();
    const stored = await db.get('settings', 'reader');
    if (!stored) return DEFAULT_SETTINGS;
    return stored as ReaderSettings;
  },

  async saveReaderSettings(settings: ReaderSettings): Promise<void> {
    const db = await getDatabase();
    await db.put('settings', { key: 'reader', ...settings });
  },

  async get<T>(key: string): Promise<T | undefined> {
    const db = await getDatabase();
    const stored = await db.get('settings', key);
    return stored as T | undefined;
  },

  async set<T>(key: string, value: T): Promise<void> {
    const db = await getDatabase();
    await db.put('settings', { key, ...value });
  },
};
