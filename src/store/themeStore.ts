import { create } from 'zustand';
import type { ReaderSettings } from '@/data/types';
import { settingsRepository } from '@/data/repositories';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}

function getSystemTheme(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(isDark: boolean): void {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function initializeTheme(): void {
  // Check localStorage first
  const stored = localStorage.getItem('theme') as Theme | null;
  const theme = stored || 'system';

  let isDark: boolean;
  if (theme === 'system') {
    isDark = getSystemTheme();
  } else {
    isDark = theme === 'dark';
  }

  applyTheme(isDark);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem('theme') as Theme) || 'system',
  isDark: (() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (!stored || stored === 'system') {
      return getSystemTheme();
    }
    return stored === 'dark';
  })(),

  setTheme: (theme: Theme) => {
    let isDark: boolean;
    if (theme === 'system') {
      isDark = getSystemTheme();
    } else {
      isDark = theme === 'dark';
    }

    localStorage.setItem('theme', theme);
    applyTheme(isDark);

    set({ theme, isDark });
  },
}));

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const state = useThemeStore.getState();
    if (state.theme === 'system') {
      applyTheme(e.matches);
      useThemeStore.setState({ isDark: e.matches });
    }
  });
}

// Reader settings store
interface ReaderSettingsState {
  settings: ReaderSettings;
  loading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<ReaderSettings>) => Promise<void>;
}

const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontFamily: 'inter',
  fontSize: 18,
  lineHeight: 1.7,
  theme: 'system',
};

export const useReaderSettingsStore = create<ReaderSettingsState>((set, get) => ({
  settings: DEFAULT_READER_SETTINGS,
  loading: true,

  loadSettings: async () => {
    try {
      const settings = await settingsRepository.getReaderSettings();
      set({ settings, loading: false });
    } catch {
      set({ settings: DEFAULT_READER_SETTINGS, loading: false });
    }
  },

  updateSettings: async (updates: Partial<ReaderSettings>) => {
    const current = get().settings;
    const newSettings = { ...current, ...updates };
    set({ settings: newSettings });
    await settingsRepository.saveReaderSettings(newSettings);
  },
}));
