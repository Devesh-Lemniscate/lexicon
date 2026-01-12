import type { TocItem } from '@/data/types';

interface TableOfContentsProps {
  isOpen: boolean;
  onClose: () => void;
  items: TocItem[];
  onItemClick: (headingId: string) => void;
}

// Clean slide-in drawer - Apple Books style
export default function TableOfContents({ isOpen, onClose, items, onItemClick }: TableOfContentsProps) {
  if (!isOpen) return null;

  const getLevelPadding = (level: number) => {
    switch (level) {
      case 1: return 'pl-0';
      case 2: return 'pl-5';
      case 3: return 'pl-10';
      default: return 'pl-14';
    }
  };

  const getLevelStyle = (level: number) => {
    if (level === 1) {
      return 'font-medium text-ink-light dark:text-ink-dark';
    }
    return 'text-ink-light/60 dark:text-ink-dark/60';
  };

  return (
    <>
      {/* Backdrop - subtle dark overlay */}
      <div 
        className="fixed inset-0 bg-black/30 z-50 transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer - slides in from right */}
      <div className="fixed inset-y-0 right-0 w-72 max-w-[85vw] bg-paper-light dark:bg-paper-dark z-50 flex flex-col shadow-2xl">
        {/* Header - minimal */}
        <div className="flex items-center justify-between h-14 px-5 border-b border-ink-light/10 dark:border-ink-dark/10">
          <h2 className="text-sm font-medium text-ink-light/70 dark:text-ink-dark/70 uppercase tracking-wider">
            Contents
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-ink-light/50 dark:text-ink-dark/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - clean list */}
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <p className="text-ink-light/40 dark:text-ink-dark/40 text-sm text-center py-12">
              No headings found
            </p>
          ) : (
            <nav>
              {items.map((item, index) => (
                <button
                  key={`${item.id}-${index}`}
                  onClick={() => onItemClick(item.id)}
                  className={`w-full text-left py-3 px-5 active:bg-black/5 dark:active:bg-white/5 transition-colors text-sm leading-snug ${getLevelPadding(item.level)} ${getLevelStyle(item.level)}`}
                >
                  {item.text}
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
