import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Source } from '@/data/types';
import { useSourcesStore } from '@/store';
import { formatTimestamp } from '@/utils/fileHelpers';
import { Modal, Button } from '@/components/common';

interface SourceItemProps {
  source: Source;
  isSyncing: boolean;
}

export default function SourceItem({ source, isSyncing }: SourceItemProps) {
  const navigate = useNavigate();
  const { syncSource, deleteSource } = useSourcesStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCache, setDeleteCache] = useState(true);

  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await syncSource(source.id);
  };

  const handleDelete = async () => {
    await deleteSource(source.id, deleteCache);
    setShowDeleteConfirm(false);
  };

  const handleNavigate = () => {
    if (!isSyncing) {
      navigate(`/library/${source.id}`);
    }
  };

  const handleLongPress = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDeleteConfirm(true);
  };

  return (
    <>
      <li
        className="py-4 cursor-pointer active:bg-gray-50 dark:active:bg-gray-800/30 transition-colors"
        onClick={handleNavigate}
        onContextMenu={handleLongPress}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-ink-light dark:text-ink-dark">
              {source.name}
            </h3>
            <p className="text-sm text-muted-light dark:text-muted-dark mt-0.5">
              {source.owner}/{source.repo}
              <span className="mx-2">·</span>
              {formatTimestamp(source.lastSyncedAt)}
            </p>
          </div>

          {/* Sync indicator/button */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="p-2 -mr-2 text-muted-light dark:text-muted-dark disabled:opacity-50"
            aria-label="Sync source"
          >
            <svg
              className={`w-5 h-5 ${isSyncing ? 'spinner' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </li>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Remove Source"
      >
        <div className="space-y-4">
          <p className="text-muted-light dark:text-muted-dark">
            Remove <strong className="text-ink-light dark:text-ink-dark">{source.name}</strong>?
          </p>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={deleteCache}
              onChange={(e) => setDeleteCache(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
            />
            <span className="text-sm text-muted-light dark:text-muted-dark">
              Also delete cached content
            </span>
          </label>

          <p className="text-xs text-muted-light dark:text-muted-dark">
            Bookmarks and notes will be preserved.
          </p>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} className="flex-1">
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
