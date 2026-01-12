import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// Clean, minimal input - no heavy borders, subtle focus state
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2 text-ink-light/70 dark:text-ink-dark/70">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2.5 rounded-lg border bg-transparent text-ink-light dark:text-ink-dark placeholder-ink-light/30 dark:placeholder-ink-dark/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors ${
            error 
              ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
              : 'border-ink-light/15 dark:border-ink-dark/15'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2 text-ink-light/70 dark:text-ink-dark/70">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-3 py-2.5 rounded-lg border bg-transparent text-ink-light dark:text-ink-dark placeholder-ink-light/30 dark:placeholder-ink-dark/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-none ${
            error 
              ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
              : 'border-ink-light/15 dark:border-ink-dark/15'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
