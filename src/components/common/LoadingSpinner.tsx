interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  message?: string;
}

// Subtle, non-jarring loading indicator
export default function LoadingSpinner({
  size = 'md',
  fullScreen = false,
  message,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeClasses[size]} border-2 border-ink-light/10 dark:border-ink-dark/10 border-t-accent/60 rounded-full animate-spin`}
      />
      {message && (
        <p className="text-sm text-ink-light/40 dark:text-ink-dark/40">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-paper-light dark:bg-paper-dark">
        {spinner}
      </div>
    );
  }

  return spinner;
}
