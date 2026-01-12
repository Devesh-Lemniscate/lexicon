import { useEffect, useRef, useState } from 'react';
import { useThemeStore, useReaderSettingsStore } from '@/store';
import { renderMarkdown } from '@/utils/markdown';
import { fileRepository } from '@/data/repositories';
import type { ReaderSettings } from '@/data/types';

const SAMPLE_TEXT = `The old man sat alone on the porch, watching the sun sink below the horizon. Each evening brought the same ritual — a cup of tea, a worn book, and the quiet company of memory.`;

const FONT_OPTIONS: { value: ReaderSettings['fontFamily']; label: string; className: string }[] = [
  { value: 'inter', label: 'Inter', className: 'font-sans' },
  { value: 'lora', label: 'Lora', className: 'font-lora' },
  { value: 'merriweather', label: 'Merriweather', className: 'font-merriweather' },
  { value: 'source-serif', label: 'Source Serif', className: 'font-source-serif' },
  { value: 'nunito', label: 'Nunito', className: 'font-nunito' },
  { value: 'crimson', label: 'Crimson', className: 'font-crimson' },
];

const getFontClass = (font: ReaderSettings['fontFamily']) => {
  const option = FONT_OPTIONS.find(o => o.value === font);
  return option?.className || 'font-sans';
};

export default function SettingsScreen() {
  const { theme, setTheme } = useThemeStore();
  const { settings, updateSettings, loadSettings } = useReaderSettingsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sampleHtml, setSampleHtml] = useState('');

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setSampleHtml(renderMarkdown(SAMPLE_TEXT));
  }, []);

  const handleOpenLocalFile = async () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().split('.').pop();
    const localSourceId = 'local';
    const filePath = file.name;

    // Determine file type
    const isMarkdown = ext === 'md';
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '');
    const isExcalidraw = file.name.endsWith('.excalidraw');

    try {
      if (isMarkdown) {
        // Text content for markdown
        const content = await file.text();
        await fileRepository.saveContent({
          sourceId: localSourceId,
          path: filePath,
          content,
          isMarkdown: true,
        });
        await fileRepository.upsert({
          sourceId: localSourceId,
          path: filePath,
          name: file.name,
          type: 'file',
          sha: crypto.randomUUID(),
          size: file.size,
          parentPath: '',
          mimeType: 'text/markdown',
        });
        window.location.href = `/read/${localSourceId}/${filePath}`;
      } else if (isImage) {
        // Binary content for images
        const blob = await file.arrayBuffer().then(buf => new Blob([buf], { type: file.type }));
        await fileRepository.saveContent({
          sourceId: localSourceId,
          path: filePath,
          content: blob,
          isMarkdown: false,
        });
        await fileRepository.upsert({
          sourceId: localSourceId,
          path: filePath,
          name: file.name,
          type: 'file',
          sha: crypto.randomUUID(),
          size: file.size,
          parentPath: '',
          mimeType: file.type,
        });
        window.location.href = `/image/${localSourceId}/${filePath}`;
      } else if (isExcalidraw) {
        // JSON content for excalidraw
        const content = await file.text();
        await fileRepository.saveContent({
          sourceId: localSourceId,
          path: filePath,
          content,
          isMarkdown: false,
        });
        await fileRepository.upsert({
          sourceId: localSourceId,
          path: filePath,
          name: file.name,
          type: 'file',
          sha: crypto.randomUUID(),
          size: file.size,
          parentPath: '',
          mimeType: 'application/excalidraw+json',
        });
        window.location.href = `/excalidraw/${localSourceId}/${filePath}`;
      } else {
        console.warn('Unsupported file type:', ext);
      }
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  };

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark pb-20">
      {/* Spacing at top */}
      <div className="safe-top pt-6" />

      {/* Preview */}
      <div className="px-5 mb-8">
        <div
          className={`${getFontClass(settings.fontFamily)} text-ink-light dark:text-ink-dark`}
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
          }}
          dangerouslySetInnerHTML={{ __html: sampleHtml }}
        />
      </div>

      {/* Settings list - Apple Books style */}
      <div className="px-5 space-y-6">
        
        {/* Font */}
        <div className="space-y-3">
          <span className="text-ink-light dark:text-ink-dark text-sm">Font</span>
          <div className="grid grid-cols-2 gap-2">
            {FONT_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => updateSettings({ fontFamily: option.value })}
                className={`px-3 py-2.5 text-sm rounded-lg transition-colors truncate ${option.className} ${
                  settings.fontFamily === option.value
                    ? 'bg-accent/10 text-accent border border-accent/30'
                    : 'bg-ink-light/5 dark:bg-ink-dark/10 text-muted-light dark:text-muted-dark border border-transparent'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div className="flex items-center justify-between py-2">
          <span className="text-ink-light dark:text-ink-dark">Size</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => updateSettings({ fontSize: Math.max(14, settings.fontSize - 2) })}
              className="w-10 h-10 flex items-center justify-center text-muted-light dark:text-muted-dark"
              aria-label="Decrease font size"
            >
              <span className="text-sm">A</span>
            </button>
            <span className="text-sm text-muted-light dark:text-muted-dark w-8 text-center">
              {settings.fontSize}
            </span>
            <button
              onClick={() => updateSettings({ fontSize: Math.min(24, settings.fontSize + 2) })}
              className="w-10 h-10 flex items-center justify-center text-muted-light dark:text-muted-dark"
              aria-label="Increase font size"
            >
              <span className="text-lg">A</span>
            </button>
          </div>
        </div>

        {/* Line spacing */}
        <div className="flex items-center justify-between py-2">
          <span className="text-ink-light dark:text-ink-dark">Spacing</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => updateSettings({ lineHeight: Math.max(1.4, settings.lineHeight - 0.2) })}
              className="w-10 h-10 flex items-center justify-center text-muted-light dark:text-muted-dark"
              aria-label="Decrease line spacing"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm text-muted-light dark:text-muted-dark w-8 text-center">
              {settings.lineHeight.toFixed(1)}
            </span>
            <button
              onClick={() => updateSettings({ lineHeight: Math.min(2.2, settings.lineHeight + 0.2) })}
              className="w-10 h-10 flex items-center justify-center text-muted-light dark:text-muted-dark"
              aria-label="Increase line spacing"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M4 4h16M4 12h16M4 20h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 dark:bg-gray-800 my-4" />

        {/* Theme */}
        <div className="flex items-center justify-between py-2">
          <span className="text-ink-light dark:text-ink-dark">Theme</span>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                theme === 'light'
                  ? 'border-accent'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              style={{ backgroundColor: '#fffdf9' }}
              aria-label="Light theme"
            />
            <button
              onClick={() => setTheme('system')}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center overflow-hidden ${
                theme === 'system'
                  ? 'border-accent'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              aria-label="System theme"
            >
              <div className="w-full h-full flex">
                <div className="w-1/2 bg-[#fffdf9]" />
                <div className="w-1/2 bg-[#121212]" />
              </div>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                theme === 'dark'
                  ? 'border-accent'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              style={{ backgroundColor: '#121212' }}
              aria-label="Dark theme"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 dark:bg-gray-800 my-4" />

        {/* Open file */}
        <button
          onClick={handleOpenLocalFile}
          className="flex items-center justify-between py-2 w-full text-left"
        >
          <span className="text-ink-light dark:text-ink-dark">Open local file</span>
          <svg className="w-5 h-5 text-muted-light dark:text-muted-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.excalidraw,.png,.jpg,.jpeg,.gif,.webp,.svg,text/markdown,image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Version */}
      <div className="px-5 pt-12 pb-8">
        <p className="text-xs text-muted-light dark:text-muted-dark text-center">
          v1.0.0
        </p>
      </div>
    </div>
  );
}
