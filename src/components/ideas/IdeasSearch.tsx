interface IdeasSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function IdeasSearch({ value, onChange }: IdeasSearchProps) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light/30 dark:text-ink-dark/30"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search ideas..."
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-ink-light/10 dark:border-ink-dark/10 bg-transparent text-ink-light dark:text-ink-dark placeholder-ink-light/30 dark:placeholder-ink-dark/30 focus:outline-none focus:border-accent/50 transition-colors text-sm"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-ink-light/10 dark:bg-ink-dark/10"
          aria-label="Clear search"
        >
          <svg className="w-3 h-3 text-ink-light/50 dark:text-ink-dark/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
