import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSourcesStore } from '@/store';
import SourceItem from './SourceItem';
import AddSourceModal from './AddSourceModal';
import SyncProgress from './SyncProgress';

export default function LibraryScreen() {
  const { sources, syncing, syncProgress, loadSources } = useSourcesStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark pb-20">
      {/* Top spacing */}
      <div className="safe-top pt-6" />

      {/* Sync progress indicator */}
      {syncing && syncProgress && <SyncProgress progress={syncProgress} />}

      {/* Sources list - bookshelf style */}
      <div className="px-5">
        {sources.length === 0 ? (
          <div className="pt-8">
            {/* Add first source button - block design */}
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full py-4 flex items-center justify-center gap-2 text-accent border-2 border-dashed border-accent/30 rounded-xl hover:bg-accent/5 transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Add GitHub source</span>
            </button>

            {/* Local files button */}
            <button
              onClick={() => navigate('/local-files')}
              className="w-full py-4 flex items-center justify-center gap-2 text-muted-light dark:text-muted-dark border border-dashed border-ink-light/10 dark:border-ink-dark/10 rounded-xl hover:bg-ink-light/5 dark:hover:bg-ink-dark/5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="font-medium">Open local files</span>
            </button>

            <p className="text-muted-light dark:text-muted-dark text-center text-sm mt-6">
              Add sources from GitHub or your device
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xs font-medium uppercase tracking-wider text-ink-light/40 dark:text-ink-dark/40 mb-3">
              Sources
            </h2>
            <ul className="space-y-1 mb-4">
              {sources.map((source) => (
                <SourceItem key={source.id} source={source} isSyncing={syncing === source.id} />
              ))}
            </ul>

            {/* Add source button - block design like in other screens */}
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full py-3 flex items-center justify-center gap-2 text-muted-light dark:text-muted-dark border border-dashed border-ink-light/10 dark:border-ink-dark/10 rounded-lg hover:bg-ink-light/5 dark:hover:bg-ink-dark/5 transition-colors mb-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm">Add GitHub source</span>
            </button>

            {/* Local files button */}
            <button
              onClick={() => navigate('/local-files')}
              className="w-full py-3 flex items-center justify-center gap-2 text-muted-light dark:text-muted-dark border border-dashed border-ink-light/10 dark:border-ink-dark/10 rounded-lg hover:bg-ink-light/5 dark:hover:bg-ink-dark/5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-sm">Local files</span>
            </button>
          </>
        )}
      </div>

      {/* Add source modal */}
      <AddSourceModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
