import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchService, type SearchResult } from '@/services/search';
import { useSourcesStore } from '@/store';
import { LoadingSpinner } from '@/components/common';

export default function SearchScreen() {
  const navigate = useNavigate();
  const { sources } = useSourcesStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize search index
  useEffect(() => {
    async function init() {
      await searchService.initialize();
      setInitialized(true);
    }
    init();
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await searchService.search(searchQuery);
      setResults(searchResults);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    if (!initialized) return;

    const timeout = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, search, initialized]);

  const handleResultClick = (result: SearchResult) => {
    navigate(`/read/${result.sourceId}/${result.filePath}`);
  };

  const getSourceName = (sourceId: string) => {
    const source = sources.find((s) => s.id === sourceId);
    return source?.name || 'Unknown';
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-accent/20 text-accent px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark pb-20">
      {/* Search input - centered when empty, top when has results */}
      <div className={`transition-all duration-300 ${hasQuery ? 'pt-4' : 'pt-32'}`}>
        <div className="px-5">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full py-3 px-4 bg-transparent text-lg border-b border-gray-200 dark:border-gray-800 focus:border-accent focus:outline-none placeholder-muted-light dark:placeholder-muted-dark"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-light dark:text-muted-dark"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="px-5 mt-4">
        {loading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : !hasQuery ? (
          <p className="text-center text-muted-light dark:text-muted-dark text-sm mt-8">
            Search across all your notes
          </p>
        ) : results.length === 0 ? (
          <p className="text-center text-muted-light dark:text-muted-dark mt-12">
            No results for "{query}"
          </p>
        ) : (
          <ul className="space-y-6 mt-2">
            {results.map((result, index) => (
              <li
                key={`${result.sourceId}-${result.filePath}-${index}`}
                onClick={() => handleResultClick(result)}
                className="cursor-pointer active:opacity-70"
              >
                <h3 className="font-medium text-ink-light dark:text-ink-dark">
                  {highlightMatch(result.title, query)}
                </h3>
                <p className="text-sm text-muted-light dark:text-muted-dark mt-0.5">
                  {getSourceName(result.sourceId)}
                </p>
                <p className="text-sm text-ink-light/80 dark:text-ink-dark/80 mt-1 line-clamp-2">
                  {highlightMatch(result.snippet, query)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
