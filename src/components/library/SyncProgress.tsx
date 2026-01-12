import type { SyncProgress as SyncProgressType } from '@/data/types';

interface SyncProgressProps {
  progress: SyncProgressType;
}

export default function SyncProgress({ progress }: SyncProgressProps) {
  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  const phaseLabels = {
    fetching: 'Fetching...',
    comparing: 'Comparing...',
    downloading: `Downloading (${progress.current}/${progress.total})`,
    indexing: 'Indexing...',
    complete: 'Complete!',
    error: 'Error',
  };

  return (
    <div className="mx-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {phaseLabels[progress.phase] || progress.message}
        </span>
        {progress.total > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">{percent}%</span>
        )}
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            progress.phase === 'error' ? 'bg-red-500' : 'bg-accent'
          }`}
          style={{ width: `${progress.phase === 'complete' ? 100 : percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">{progress.message}</p>
    </div>
  );
}
