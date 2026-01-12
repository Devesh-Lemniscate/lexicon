import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fileRepository, readingProgressRepository } from '@/data/repositories';
import { useSourcesStore } from '@/store';
import { sortFilesAndFolders } from '@/utils/fileHelpers';
import type { FileEntry, Source } from '@/data/types';
import { LoadingSpinner, EmptyState } from '@/components/common';

// Table of contents style file browser - clean and minimal
export default function FolderView() {
  const { sourceId, '*': currentPath = '' } = useParams();
  const navigate = useNavigate();
  const { sources } = useSourcesStore();

  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<Source | null>(null);

  useEffect(() => {
    const found = sources.find((s) => s.id === sourceId);
    setSource(found || null);
  }, [sources, sourceId]);

  useEffect(() => {
    async function loadFiles() {
      if (!sourceId) return;

      setLoading(true);
      try {
        const allFiles = await fileRepository.getByParent(sourceId, currentPath);
        setFiles(sortFilesAndFolders(allFiles));
      } catch (err) {
        console.error('Failed to load files:', err);
      } finally {
        setLoading(false);
      }
    }

    loadFiles();
  }, [sourceId, currentPath]);

  const handleItemClick = async (item: FileEntry) => {
    if (item.type === 'folder') {
      navigate(`/library/${sourceId}/${item.path}`);
    } else if (item.path.endsWith('.md')) {
      await readingProgressRepository.setLastOpened(sourceId!, item.path);
      navigate(`/read/${sourceId}/${item.path}`);
    } else if (item.path.endsWith('.excalidraw')) {
      navigate(`/excalidraw/${sourceId}/${item.path}`);
    } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(item.path)) {
      navigate(`/image/${sourceId}/${item.path}`);
    }
  };

  const getFileIcon = (item: FileEntry) => {
    if (item.type === 'folder') {
      return (
        <svg className="w-5 h-5 text-ink-light/30 dark:text-ink-dark/30 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      );
    }
    if (item.path.endsWith('.excalidraw')) {
      return (
        <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
        </svg>
      );
    }
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(item.path)) {
      return (
        <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-ink-light/30 dark:text-ink-dark/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const getDisplayName = (item: FileEntry) => {
    let name = item.name;
    if (name.endsWith('.md')) name = name.slice(0, -3);
    if (name.endsWith('.excalidraw')) name = name.slice(0, -11);
    return name;
  };

  const handleBack = () => {
    if (currentPath) {
      const parentPath = currentPath.split('/').slice(0, -1).join('/');
      if (parentPath) {
        navigate(`/library/${sourceId}/${parentPath}`);
      } else {
        navigate(`/library/${sourceId}`);
      }
    } else {
      navigate('/library');
    }
  };

  const title = useMemo(() => {
    if (!currentPath) return source?.name || 'Files';
    const parts = currentPath.split('/');
    return parts[parts.length - 1];
  }, [currentPath, source]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark">
      {/* Minimal header */}
      <header className="sticky top-0 z-40 bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-sm safe-top">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10 -ml-2"
            aria-label="Go back"
          >
            <svg className="w-5 h-5 text-ink-light/60 dark:text-ink-dark/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-base font-medium text-ink-light dark:text-ink-dark truncate ml-1">
            {title}
          </h1>
        </div>
      </header>

      <div className="px-5 pb-6">
        {files.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            }
            title={source?.lastSyncedAt ? 'No files here' : 'Not synced yet'}
            description={
              source?.lastSyncedAt
                ? 'This folder is empty or contains no supported files'
                : 'Sync this source to load files'
            }
          />
        ) : (
          <nav className="pt-2">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => handleItemClick(file)}
                className="w-full flex items-center gap-3 py-3 active:bg-black/5 dark:active:bg-white/5 transition-colors text-left"
              >
                {getFileIcon(file)}
                <span className="flex-1 truncate text-ink-light dark:text-ink-dark text-sm">
                  {getDisplayName(file)}
                </span>
                {file.type === 'folder' && (
                  <svg className="w-4 h-4 text-ink-light/30 dark:text-ink-dark/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
