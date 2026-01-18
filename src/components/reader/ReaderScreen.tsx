import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fileRepository, readingProgressRepository, bookmarkRepository } from '@/data/repositories';
import { useReaderSettingsStore } from '@/store';
import { renderMarkdown, extractToc, getHeadingAtPosition } from '@/utils/markdown';
import type { TocItem, FileContent, ReaderSettings } from '@/data/types';
import { LoadingSpinner } from '@/components/common';
import ReaderControls from './ReaderControls';
import TableOfContents from './TableOfContents';
import ImageViewer from './ImageViewer';
import AnnotationModal from './AnnotationModal';

const FONT_CLASS_MAP: Record<ReaderSettings['fontFamily'], string> = {
  'inter': 'font-sans',
  'lora': 'font-lora',
  'merriweather': 'font-merriweather',
  'source-serif': 'font-source-serif',
  'nunito': 'font-nunito',
  'crimson': 'font-crimson',
};

export default function ReaderScreen() {
  const { sourceId, '*': filePath = '' } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const { settings, loadSettings } = useReaderSettingsStore();

  const [content, setContent] = useState<string>('');
  const [html, setHtml] = useState<string>('');
  const [toc, setToc] = useState<TocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [annotationHeading, setAnnotationHeading] = useState<TocItem | null>(null);
  
  // Zoom state for content
  const [contentScale, setContentScale] = useState(1);
  const lastPinchDistance = useRef<number | null>(null);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Load content
  useEffect(() => {
    async function loadContent() {
      if (!sourceId || !filePath) return;

      setLoading(true);
      try {
        const fileContent = await fileRepository.getContent(sourceId, filePath);
        if (fileContent && fileContent.isMarkdown) {
          const markdown = fileContent.content as string;
          setContent(markdown);
          setHtml(renderMarkdown(markdown));
          setToc(extractToc(markdown));
        }

        // Check if this file is bookmarked (only one bookmark per file allowed)
        const fileBookmarks = await bookmarkRepository.getByFile(sourceId, filePath);
        if (fileBookmarks.length > 0) {
          setIsBookmarked(true);
          setBookmarkId(fileBookmarks[0].id);
        } else {
          setIsBookmarked(false);
          setBookmarkId(null);
        }

        // Restore reading position
        const progress = await readingProgressRepository.get(sourceId, filePath);
        if (progress && contentRef.current) {
          setTimeout(() => {
            if (progress.headingId) {
              const element = document.getElementById(progress.headingId);
              if (element) {
                element.scrollIntoView();
                setHasRestoredProgress(true);
                return;
              }
            }
            // Fallback to percentage
            const scrollHeight = document.documentElement.scrollHeight;
            window.scrollTo(0, scrollHeight * progress.offsetPercent);
            setHasRestoredProgress(true);
          }, 100);
        } else {
          // No saved progress, allow saving immediately
          setHasRestoredProgress(true);
        }
      } catch (err) {
        console.error('Failed to load content:', err);
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
    const heading = getHeadingAtPosition(content, Math.floor(content.length * offsetPercent));

    readingProgressRepository.save({
      sourceId,
      filePath,
      headingId: heading?.id,
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

  // Pinch-to-zoom handlers for touch devices
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastPinchDistance.current = distance;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance.current !== null) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = distance / lastPinchDistance.current;
      setContentScale((prev) => Math.min(Math.max(prev * delta, 0.5), 3));
      lastPinchDistance.current = distance;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistance.current = null;
  }, []);

  // Mouse wheel zoom with Ctrl key
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      setContentScale((prev) => Math.min(Math.max(prev * delta, 0.5), 3));
    }
  }, []);

  // Double-tap to reset zoom
  const lastTapTime = useRef(0);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      // Double tap detected - reset zoom or zoom in
      if (contentScale !== 1) {
        setContentScale(1);
      } else {
        setContentScale(1.5);
      }
    }
    lastTapTime.current = now;
  }, [contentScale]);

  // Handle content tap
  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Handle image clicks
    if (target.tagName === 'IMG') {
      const src = target.getAttribute('src');
      if (src) {
        handleImageClick(src);
        return;
      }
    }

    // Handle link clicks
    if (target.tagName === 'A') {
      e.preventDefault();
      const href = target.getAttribute('href');
      if (href?.startsWith('#')) {
        const element = document.getElementById(href.slice(1));
        element?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Check for double tap to toggle zoom
    handleDoubleTap();

    // Toggle controls on tap
    setShowControls(!showControls);
  };

  const handleImageClick = async (src: string) => {
    // Handle relative image paths
    if (src.startsWith('./') || !src.startsWith('http')) {
      const imagePath = src.startsWith('./') ? src.slice(2) : src;
      const fullPath = filePath.includes('/') 
        ? `${filePath.split('/').slice(0, -1).join('/')}/${imagePath}`
        : imagePath;

      try {
        const imageContent = await fileRepository.getContent(sourceId!, fullPath) as FileContent | undefined;
        if (imageContent && !imageContent.isMarkdown) {
          const blob = imageContent.content as Blob;
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
          return;
        }
      } catch (err) {
        console.error('Failed to load image:', err);
      }
    }

    setImageUrl(src);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleToggleBookmark = async () => {
    if (!sourceId || !filePath) return;

    if (isBookmarked && bookmarkId) {
      // Remove existing bookmark
      await bookmarkRepository.delete(bookmarkId);
      setIsBookmarked(false);
      setBookmarkId(null);
    } else {
      // Create new bookmark
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const offsetPercent = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      const heading = getHeadingAtPosition(content, Math.floor(content.length * offsetPercent));

      const newBookmark = await bookmarkRepository.create({
        sourceId,
        filePath,
        headingId: heading?.id,
        offsetPercent,
        title: heading?.text || filePath.split('/').pop()?.replace('.md', '') || 'Bookmark',
        snippet: content.slice(0, 100),
      });

      setIsBookmarked(true);
      setBookmarkId(newBookmark.id);
    }
  };

  const handleAddNote = () => {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const offsetPercent = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    const heading = getHeadingAtPosition(content, Math.floor(content.length * offsetPercent));
    setAnnotationHeading(heading || null);
    setShowAnnotation(true);
  };

  const scrollToHeading = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setShowToc(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const fileName = filePath.split('/').pop()?.replace('.md', '') || 'Document';

  return (
    <div 
      className="min-h-screen bg-paper-light dark:bg-paper-dark transition-colors duration-300"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Reader Controls - invisible until tap */}
      <ReaderControls
        visible={showControls}
        title={fileName}
        onBack={handleBack}
        onToc={() => setShowToc(true)}
        onToggleBookmark={handleToggleBookmark}
        onAddNote={handleAddNote}
        isBookmarked={isBookmarked}
        scale={contentScale}
        onZoomIn={() => setContentScale((prev) => Math.min(prev + 0.25, 3))}
        onZoomOut={() => setContentScale((prev) => Math.max(prev - 0.25, 0.5))}
        onZoomReset={() => setContentScale(1)}
      />

      {/* Main reading area - generous padding for comfortable reading */}
      <article
        ref={contentRef}
        onClick={handleContentClick}
        className={`reader-content max-w-reading mx-auto px-6 sm:px-8 py-12 sm:py-16 ${
          FONT_CLASS_MAP[settings.fontFamily] || 'font-sans'
        }`}
        style={{
          fontSize: `${settings.fontSize * contentScale}px`,
          lineHeight: settings.lineHeight,
          transformOrigin: 'top center',
          transition: 'font-size 0.15s ease-out',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Zoom indicator */}
      {contentScale !== 1 && (
        <div className="fixed bottom-6 right-6 z-30 bg-ink-light/10 dark:bg-ink-dark/10 text-ink-light/60 dark:text-ink-dark/60 text-xs px-3 py-1.5 rounded-full">
          {Math.round(contentScale * 100)}%
        </div>
      )}

      {/* Table of Contents */}
      <TableOfContents
        isOpen={showToc}
        onClose={() => setShowToc(false)}
        items={toc}
        onItemClick={scrollToHeading}
      />

      {/* Image Viewer */}
      {imageUrl && <ImageViewer src={imageUrl} onClose={() => setImageUrl(null)} />}

      {/* Annotation Modal */}
      <AnnotationModal
        isOpen={showAnnotation}
        onClose={() => setShowAnnotation(false)}
        sourceId={sourceId!}
        filePath={filePath}
        heading={annotationHeading}
      />
    </div>
  );
}
