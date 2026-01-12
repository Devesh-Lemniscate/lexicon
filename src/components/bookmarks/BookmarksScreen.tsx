import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookmarkRepository } from '@/data/repositories';
import { useSourcesStore } from '@/store';
import { formatTimestamp } from '@/utils/fileHelpers';
import type { Bookmark } from '@/data/types';
import { LoadingSpinner, Modal, Button } from '@/components/common';

export default function BookmarksScreen() {
  const navigate = useNavigate();
  const { sources } = useSourcesStore();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const loadedBookmarks = await bookmarkRepository.getAll();
        setBookmarks(loadedBookmarks);
      } catch (err) {
        console.error('Failed to load bookmarks:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const getSourceName = (sourceId: string) => {
    const source = sources.find((s) => s.id === sourceId);
    return source?.name || '';
  };

  const handleBookmarkClick = (bookmark: Bookmark) => {
    navigate(`/read/${bookmark.sourceId}/${bookmark.filePath}`);
  };

  const handleDeleteBookmark = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await bookmarkRepository.delete(deleteConfirm);
    setBookmarks((prev) => prev.filter((b) => b.id !== deleteConfirm));
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark pb-20">
      {/* Top spacing */}
      <div className="safe-top pt-6" />

      {/* Header */}
      <div className="px-5 pb-4">
        <h1 className="text-xl font-semibold text-ink-light dark:text-ink-dark">Bookmarks</h1>
      </div>

      {/* Content */}
      <div className="px-5">
        {bookmarks.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <p className="text-muted-light dark:text-muted-dark text-sm">No bookmarks yet</p>
            <p className="text-xs text-muted-light/60 dark:text-muted-dark/60 mt-1">
              Tap the bookmark icon while reading to save pages
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {bookmarks.map((bookmark) => (
              <li
                key={bookmark.id}
                onClick={() => handleBookmarkClick(bookmark)}
                className="cursor-pointer p-3 rounded-lg hover:bg-ink-light/5 dark:hover:bg-ink-dark/5 active:opacity-70 group transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-ink-light dark:text-ink-dark text-sm">
                        {bookmark.title}
                      </h3>
                      <p className="text-xs text-muted-light dark:text-muted-dark mt-0.5">
                        {getSourceName(bookmark.sourceId)}
                        {getSourceName(bookmark.sourceId) && ' · '}
                        {formatTimestamp(bookmark.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteBookmark(e, bookmark.id)}
                    className="p-2 -mr-2 text-muted-light dark:text-muted-dark opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete bookmark"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete bookmark?"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-light dark:text-muted-dark">
            This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} className="flex-1">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
