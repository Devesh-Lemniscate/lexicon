interface ReaderControlsProps {
  visible: boolean;
  title: string;
  onBack: () => void;
  onToc: () => void;
  onToggleBookmark: () => void;
  onAddNote: () => void;
  isBookmarked: boolean;
  scale?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
}

// Kindle/Apple Books style: single top bar, no bottom bar
// Icons only, no text labels - clean and minimal
export default function ReaderControls({
  visible,
  title,
  onBack,
  onToc,
  onToggleBookmark,
  onAddNote,
  isBookmarked,
  scale = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: ReaderControlsProps) {
  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-50 safe-top transition-all duration-300 ease-out ${
          visible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        {/* Glass effect with backdrop blur */}
        <div className="absolute inset-0 bg-paper-light/70 dark:bg-paper-dark/70 backdrop-blur-md border-b border-ink-light/5 dark:border-ink-dark/5" />
        
        <div className="relative flex items-center justify-between h-14 px-4 max-w-reading mx-auto">
          {/* Left: Back */}
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10 transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5 text-ink-light/70 dark:text-ink-dark/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Center: Title - subtle, not competing with content */}
          <h1 className="flex-1 text-center text-sm text-ink-light/50 dark:text-ink-dark/50 font-normal truncate px-2">
            {title}
          </h1>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleBookmark}
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10 transition-colors"
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              <svg
                className={`w-5 h-5 ${isBookmarked ? 'text-accent' : 'text-ink-light/70 dark:text-ink-dark/70'}`}
                fill={isBookmarked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>

            <button
              onClick={onAddNote}
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10 transition-colors"
              aria-label="Add note"
            >
              <svg className="w-5 h-5 text-ink-light/70 dark:text-ink-dark/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            <button
              onClick={onToc}
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10 transition-colors"
              aria-label="Table of contents"
            >
              <svg className="w-5 h-5 text-ink-light/70 dark:text-ink-dark/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom zoom controls */}
      {visible && onZoomIn && onZoomOut && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 safe-bottom transition-all duration-300 ease-out ${
            visible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-full pointer-events-none'
          }`}
        >
          {/* Gradient fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-paper-light via-paper-light/80 to-transparent dark:from-paper-dark dark:via-paper-dark/80" />
          
          <div className="relative flex items-center justify-center h-14 px-4 gap-2">
            <button
              onClick={onZoomOut}
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10 transition-colors"
              aria-label="Zoom out"
            >
              <svg className="w-5 h-5 text-ink-light/70 dark:text-ink-dark/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            
            <button
              onClick={onZoomReset}
              className="min-w-[4rem] h-8 flex items-center justify-center rounded-full bg-ink-light/5 dark:bg-ink-dark/5 active:bg-ink-light/10 dark:active:bg-ink-dark/10 transition-colors"
              aria-label="Reset zoom"
            >
              <span className="text-sm text-ink-light/70 dark:text-ink-dark/70">
                {Math.round(scale * 100)}%
              </span>
            </button>
            
            <button
              onClick={onZoomIn}
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10 transition-colors"
              aria-label="Zoom in"
            >
              <svg className="w-5 h-5 text-ink-light/70 dark:text-ink-dark/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
