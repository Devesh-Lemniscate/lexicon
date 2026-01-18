import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fileRepository, readingProgressRepository } from '@/data/repositories';
import { useReaderSettingsStore } from '@/store';
import { LoadingSpinner } from '@/components/common';

const FONT_CLASS_MAP: Record<string, string> = {
  'inter': 'font-sans',
  'lora': 'font-lora',
  'merriweather': 'font-merriweather',
  'source-serif': 'font-source-serif',
  'nunito': 'font-nunito',
  'crimson': 'font-crimson',
};

// Syntax highlighting colors based on file type
const getLanguageClass = (path: string): string => {
  const ext = path.toLowerCase().split('.').pop();
  switch (ext) {
    case 'json':
      return 'language-json';
    case 'yaml':
    case 'yml':
      return 'language-yaml';
    case 'xml':
    case 'html':
      return 'language-html';
    case 'css':
      return 'language-css';
    default:
      return 'language-text';
  }
};

export default function TextViewerScreen() {
  const { sourceId, '*': filePath = '' } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const { settings, loadSettings } = useReaderSettingsStore();

  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [scale, setScale] = useState(1);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);

  const fileName = filePath.split('/').pop() || 'Document';
  const fileExt = fileName.split('.').pop()?.toUpperCase() || 'TXT';

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Load content
  useEffect(() => {
    async function loadContent() {
      if (!sourceId || !filePath) {
        setError('Invalid file path');
        setLoading(false);
        return;
      }

      try {
        const fileContent = await fileRepository.getContent(sourceId, filePath);
        if (fileContent && typeof fileContent.content === 'string') {
          setContent(fileContent.content);

          // Restore reading position
          const progress = await readingProgressRepository.get(sourceId, filePath);
          if (progress && contentRef.current) {
            setTimeout(() => {
              const scrollHeight = document.documentElement.scrollHeight;
              window.scrollTo(0, scrollHeight * progress.offsetPercent);
              setHasRestoredProgress(true);
            }, 100);
          } else {
            // No saved progress, allow saving immediately
            setHasRestoredProgress(true);
          }
        } else {
          setError('File not found or not readable');
        }
      } catch (err) {
        console.error('Failed to load content:', err);
        setError('Failed to load file');
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [sourceId, filePath]);

  // Save reading progress on scroll
  const saveProgress = useCallback(() => {
    if (!sourceId || !filePath || !content) return;

    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const offsetPercent = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

    readingProgressRepository.save({
      sourceId,
      filePath,
      offsetPercent,
      lastReadAt: Date.now(),
    });
  }, [sourceId, filePath, content]);

  // Debounced scroll handler - only save after progress has been restored
  useEffect(() => {
    if (!hasRestoredProgress) return;

    let timeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(saveProgress, 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, [saveProgress, hasRestoredProgress]);

  const handleBack = () => {
    saveProgress();
    navigate(-1);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleContentClick = () => {
    setShowControls(!showControls);
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-paper-light dark:bg-paper-dark flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-muted-light dark:text-muted-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-muted-light dark:text-muted-dark mb-4">{error || 'No content'}</p>
          <button onClick={handleBack} className="text-accent font-medium">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark transition-colors duration-300">
      {/* Header - visible when controls shown */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-sm border-b border-ink-light/10 dark:border-ink-dark/10 safe-top transition-transform duration-200 ${
          showControls ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-ink-light/60 dark:text-ink-dark/60"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex-1 text-center">
            <h1 className="text-sm font-medium text-ink-light dark:text-ink-dark truncate">
              {fileName}
            </h1>
            <span className="text-xs text-muted-light dark:text-muted-dark">{fileExt}</span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              className="p-2 text-ink-light/60 dark:text-ink-dark/60"
              aria-label="Zoom out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-xs text-muted-light dark:text-muted-dark min-w-[2.5rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-ink-light/60 dark:text-ink-dark/60"
              aria-label="Zoom in"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div
        ref={contentRef}
        onClick={handleContentClick}
        className={`max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 ${
          FONT_CLASS_MAP[settings.fontFamily] || 'font-mono'
        }`}
        style={{
          fontSize: `${settings.fontSize * scale}px`,
          lineHeight: settings.lineHeight,
        }}
      >
        <pre
          className={`whitespace-pre-wrap break-words text-ink-light dark:text-ink-dark ${getLanguageClass(filePath)}`}
        >
          {content}
        </pre>
      </div>

      {/* Zoom indicator when not at 100% */}
      {scale !== 1 && (
        <div className="fixed bottom-6 right-6 bg-ink-light/10 dark:bg-ink-dark/10 text-ink-light/60 dark:text-ink-dark/60 text-xs px-3 py-1.5 rounded-full">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
}
