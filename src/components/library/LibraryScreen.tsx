import { useEffect, useState } from 'react';
import { useSourcesStore } from '@/store';
import { LoadingSpinner } from '@/components/common';
import SourceItem from './SourceItem';
import AddSourceModal from './AddSourceModal';
import SyncProgress from './SyncProgress';

export default function LibraryScreen() {
  const { sources, loading, syncing, syncProgress, loadSources } = useSourcesStore();
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

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

      {/* Sync progress indicator */}
      {syncing && syncProgress && <SyncProgress progress={syncProgress} />}

      {/* Sources list - bookshelf style */}
      <div className="px-5">
        {sources.length === 0 ? (
          <div className="pt-16 text-center">
            <p className="text-muted-light dark:text-muted-dark mb-8">
              No sources yet
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-accent font-medium"
            >
              Add your first source
            </button>
          </div>
        ) : (
          <ul className="space-y-1">
            {sources.map((source) => (
              <SourceItem key={source.id} source={source} isSyncing={syncing === source.id} />
            ))}
          </ul>
        )}
      </div>

      {/* Floating add button */}
      {sources.length > 0 && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed right-5 bottom-20 w-12 h-12 bg-accent text-white rounded-full shadow-lg flex items-center justify-center safe-bottom"
          aria-label="Add source"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Add source modal */}
      <AddSourceModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
