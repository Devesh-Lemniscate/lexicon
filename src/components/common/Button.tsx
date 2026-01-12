import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

// Clean, minimal button - no heavy shadows or borders
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]';

    const variantClasses = {
      primary:
        'bg-accent text-white hover:bg-accent/90 focus:ring-accent/50',
      secondary:
        'bg-ink-light/5 dark:bg-ink-dark/10 text-ink-light dark:text-ink-dark hover:bg-ink-light/10 dark:hover:bg-ink-dark/15 focus:ring-ink-light/20',
      ghost:
        'bg-transparent hover:bg-ink-light/5 dark:hover:bg-ink-dark/10 text-ink-light/70 dark:text-ink-dark/70 focus:ring-ink-light/20',
      danger:
        'bg-red-500/90 text-white hover:bg-red-500 focus:ring-red-500/50',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-5 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
