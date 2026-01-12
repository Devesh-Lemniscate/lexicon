interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export default function Header({ title, showBack, onBack, rightAction, transparent }: HeaderProps) {
  return (
    <header className={`sticky top-0 z-30 safe-top ${
      transparent 
        ? 'bg-transparent' 
        : 'bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-sm'
    }`}>
      <div className="flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-muted-light dark:text-muted-dark"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {title && <h1 className="text-base font-medium truncate">{title}</h1>}
        </div>
        {rightAction && <div className="flex items-center">{rightAction}</div>}
      </div>
    </header>
  );
}
