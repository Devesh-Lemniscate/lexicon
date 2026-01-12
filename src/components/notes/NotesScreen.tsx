import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { annotationRepository } from '@/data/repositories';
import { useSourcesStore } from '@/store';
import { formatTimestamp } from '@/utils/fileHelpers';
import type { Annotation } from '@/data/types';
import { LoadingSpinner, Modal, Button } from '@/components/common';

export default function NotesScreen() {
  const navigate = useNavigate();
  const { sources } = useSourcesStore();

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const loadedAnnotations = await annotationRepository.getAll();
        setAnnotations(loadedAnnotations);
      } catch (err) {
        console.error('Failed to load notes:', err);
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

  const handleAnnotationClick = (annotation: Annotation) => {
    navigate(`/read/${annotation.sourceId}/${annotation.filePath}`);
  };

  const handleDeleteAnnotation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await annotationRepository.delete(deleteConfirm);
    setAnnotations((prev) => prev.filter((a) => a.id !== deleteConfirm));
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
        <h1 className="text-xl font-semibold text-ink-light dark:text-ink-dark">Notes</h1>
      </div>

      {/* Content */}
      <div className="px-5">
        {annotations.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="text-muted-light dark:text-muted-dark text-sm">No notes yet</p>
            <p className="text-xs text-muted-light/60 dark:text-muted-dark/60 mt-1">
              Add notes while reading to capture your thoughts
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {annotations.map((annotation) => (
              <li
                key={annotation.id}
                onClick={() => handleAnnotationClick(annotation)}
                className="cursor-pointer p-4 rounded-xl bg-accent/5 border border-accent/10 hover:bg-accent/10 active:opacity-70 group transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-ink-light dark:text-ink-dark text-sm italic leading-relaxed">
                      "{annotation.note}"
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-1 h-1 rounded-full bg-accent" />
                      <p className="text-xs text-muted-light dark:text-muted-dark">
                        {getSourceName(annotation.sourceId)}
                        {getSourceName(annotation.sourceId) && ' · '}
                        {annotation.headingId && (
                          <span className="capitalize">{annotation.headingId.replace(/-/g, ' ')} · </span>
                        )}
                        {formatTimestamp(annotation.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteAnnotation(e, annotation.id)}
                    className="p-2 -mr-2 text-muted-light dark:text-muted-dark opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete note"
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
        title="Delete note?"
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
