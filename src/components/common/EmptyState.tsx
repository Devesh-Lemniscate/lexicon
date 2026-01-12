interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

// Simple, elegant empty state - no heavy containers
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="text-ink-light/20 dark:text-ink-dark/20 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-medium text-ink-light/60 dark:text-ink-dark/60 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-ink-light/40 dark:text-ink-dark/40 max-w-xs mb-5">{description}</p>
      )}
      {action}
    </div>
  );
}
