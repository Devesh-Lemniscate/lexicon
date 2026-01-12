import { useState, useEffect } from 'react';

interface AuthGateProps {
  children: React.ReactNode;
}

// SHA-256 hash of the password (password is NOT stored in code)
const PASSWORD_HASH = 'T#pZ9cFyhuKEWGrTvysGQDrmIaEihj5N';

// Hash function using Web Crypto API
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'lexicon_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Custom encoding to obscure the hash format
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*+=';
  return hashArray.slice(0, 32).map(b => chars[b % chars.length]).join('');
};

const AUTH_KEY = 'lexicon_authenticated';

export default function AuthGate({ children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    setIsAuthenticated(stored === 'true');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError(false);
    
    const hash = await hashPassword(password);
    if (hash === PASSWORD_HASH) {
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
    } else {
      setError(true);
      setPassword('');
    }
    setChecking(false);
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-paper-light dark:bg-paper-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Already authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Password gate
  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-ink-light dark:text-ink-dark">Lexicon</h1>
          <p className="text-sm text-muted-light dark:text-muted-dark mt-1">Enter password to continue</p>
        </div>

        {/* Password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 text-ink-light dark:text-ink-dark placeholder:text-muted-light dark:placeholder:text-muted-dark focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors ${
                error 
                  ? 'border-red-400 focus:border-red-400' 
                  : 'border-ink-light/15 dark:border-ink-dark/15 focus:border-accent'
              }`}
              autoFocus
              autoComplete="current-password"
            />
            {error && (
              <p className="mt-2 text-sm text-red-500 text-center">
                Incorrect password
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!password || checking}
            className="w-full py-3 bg-accent text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {checking ? 'Verifying...' : 'Unlock'}
          </button>
        </form>

        <p className="text-xs text-center text-muted-light dark:text-muted-dark mt-6">
          Private access only
        </p>
      </div>
    </div>
  );
}
