import { useRef, useState } from 'react';
import type { TodoItem } from '@/data/types';

interface TodoItemRowProps {
  todo: TodoItem;
  onToggle: () => void;
  onDelete: () => void;
  onTap: () => void;
  isDeleteConfirm: boolean;
}

export default function TodoItemRow({
  todo,
  onToggle,
  onDelete,
  onTap,
  isDeleteConfirm,
}: TodoItemRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startTranslateX = useRef(0);

  const SWIPE_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startTranslateX.current = translateX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    const newTranslate = startTranslateX.current + diff;
    
    // Clamp between -100 and 100
    setTranslateX(Math.max(-100, Math.min(100, newTranslate)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (translateX > SWIPE_THRESHOLD) {
      // Swipe right - toggle complete
      onToggle();
      setTranslateX(0);
    } else if (translateX < -SWIPE_THRESHOLD) {
      // Swipe left - delete
      onDelete();
      if (!isDeleteConfirm) {
        setTranslateX(0);
      }
    } else {
      // Snap back
      setTranslateX(0);
    }
  };

  const handleClick = () => {
    if (Math.abs(translateX) < 10) {
      onTap();
    }
  };

  const formatDueDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = todo.dueDate && !todo.completed && todo.dueDate < Date.now();

  return (
    <div className="relative mb-2 overflow-hidden rounded-lg">
      {/* Background actions */}
      <div className="absolute inset-0 flex">
        {/* Right swipe - complete */}
        <div
          className={`flex-1 flex items-center justify-start pl-4 ${
            todo.completed ? 'bg-amber-500' : 'bg-green-500'
          }`}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {todo.completed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            )}
          </svg>
        </div>
        {/* Left swipe - delete */}
        <div className="flex-1 flex items-center justify-end pr-4 bg-red-500">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
      </div>

      {/* Foreground content */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        className={`relative bg-paper-light dark:bg-paper-dark py-4 px-4 cursor-pointer ${
          isDragging ? '' : 'transition-transform duration-200'
        }`}
        style={{ transform: `translateX(${translateX}px)` }}
      >
        {isDeleteConfirm ? (
          <div className="flex items-center justify-between">
            <span className="text-red-500 font-medium">Swipe left again to delete</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTranslateX(0);
              }}
              className="text-sm text-ink-light/50 dark:text-ink-dark/50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p
                className={`text-base leading-snug ${
                  todo.completed
                    ? 'line-through text-ink-light/40 dark:text-ink-dark/40'
                    : 'text-ink-light dark:text-ink-dark'
                }`}
              >
                {todo.title}
              </p>
              {todo.dueDate && (
                <p
                  className={`text-xs mt-1 ${
                    isOverdue
                      ? 'text-red-500'
                      : 'text-ink-light/50 dark:text-ink-dark/50'
                  }`}
                >
                  {formatDueDate(todo.dueDate)}
                  {todo.reminders.length > 0 && (
                    <span className="ml-2">🔔 {todo.reminders.filter((r) => !r.notified).length}</span>
                  )}
                </p>
              )}
            </div>
            <svg
              className="w-4 h-4 text-ink-light/20 dark:text-ink-dark/20 flex-shrink-0 mt-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
