import { useState } from 'react';
import { Modal, Button, Input } from '@/components/common';

interface AddTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, dueDate?: number) => void;
}

export default function AddTodoModal({ isOpen, onClose, onAdd }: AddTodoModalProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dueDateTimestamp = dueDate ? new Date(dueDate).getTime() : undefined;
    onAdd(title.trim(), dueDateTimestamp);
    setTitle('');
    setDueDate('');
  };

  const handleClose = () => {
    setTitle('');
    setDueDate('');
    onClose();
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="What needs to be done?"
          placeholder="Enter your task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        <div>
          <label className="block text-sm font-medium mb-2 text-ink-light/70 dark:text-ink-dark/70">
            Due date (optional)
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={today}
            className="w-full px-3 py-2.5 rounded-lg border border-ink-light/15 dark:border-ink-dark/15 bg-paper-light dark:bg-paper-dark text-ink-light dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim()} className="flex-1">
            Add Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
