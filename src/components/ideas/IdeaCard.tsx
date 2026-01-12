import type { Idea } from '@/data/types';

interface IdeaCardProps {
  idea: Idea;
  onClick: () => void;
}

export default function IdeaCard({ idea, onClick }: IdeaCardProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get preview of content (first 100 chars)
  const preview = idea.content.length > 100
    ? idea.content.substring(0, 100).trim() + '...'
    : idea.content;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg bg-ink-light/[0.02] dark:bg-ink-dark/[0.03] active:bg-ink-light/5 dark:active:bg-ink-dark/5 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-ink-light dark:text-ink-dark mb-1 truncate">
            {idea.title}
          </h3>
          <p className="text-sm text-ink-light/50 dark:text-ink-dark/50 line-clamp-2">
            {preview}
          </p>
        </div>
        <span className="text-xs text-ink-light/30 dark:text-ink-dark/30 flex-shrink-0">
          {formatDate(idea.createdAt)}
        </span>
      </div>
    </button>
  );
}
