import { create } from 'zustand';
import type { Source, SyncProgress } from '@/data/types';
import { sourceRepository } from '@/data/repositories';
import { syncService } from '@/services/sync';

interface SourcesState {
  sources: Source[];
  loading: boolean;
  syncing: string | null; // sourceId being synced
  syncProgress: SyncProgress | null;
  error: string | null;

  // Actions
  loadSources: () => Promise<void>;
  addSource: (source: Omit<Source, 'id' | 'createdAt'>) => Promise<Source>;
  updateSource: (id: string, updates: Partial<Source>) => Promise<void>;
  deleteSource: (id: string, deleteCache: boolean) => Promise<void>;
  syncSource: (id: string) => Promise<void>;
}

export const useSourcesStore = create<SourcesState>((set, get) => ({
  sources: [],
  loading: true,
  syncing: null,
  syncProgress: null,
  error: null,

  loadSources: async () => {
    set({ loading: true, error: null });
    try {
      const sources = await sourceRepository.getAll();
      set({ sources, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load sources';
      set({ error: message, loading: false });
    }
  },

  addSource: async (sourceData) => {
    set({ error: null });
    try {
      const source = await sourceRepository.create(sourceData);
      set((state) => ({ sources: [...state.sources, source] }));
      return source;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add source';
      set({ error: message });
      throw err;
    }
  },

  updateSource: async (id, updates) => {
    set({ error: null });
    try {
      const updated = await sourceRepository.update(id, updates);
      if (updated) {
        set((state) => ({
          sources: state.sources.map((s) => (s.id === id ? updated : s)),
        }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update source';
      set({ error: message });
      throw err;
    }
  },

  deleteSource: async (id, deleteCache) => {
    set({ error: null });
    try {
      await syncService.deleteSourceData(id, deleteCache);
      set((state) => ({
        sources: state.sources.filter((s) => s.id !== id),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete source';
      set({ error: message });
      throw err;
    }
  },

  syncSource: async (id) => {
    const source = get().sources.find((s) => s.id === id);
    if (!source || get().syncing) return;

    set({ syncing: id, syncProgress: null, error: null });

    try {
      const result = await syncService.syncSource(source, (progress) => {
        set({ syncProgress: progress });
      });

      if (!result.success && result.errors.length > 0) {
        set({ error: result.errors.join(', ') });
      }

      // Reload sources to get updated lastSyncedAt
      await get().loadSources();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      set({ error: message });
    } finally {
      set({ syncing: null, syncProgress: null });
    }
  },
}));
