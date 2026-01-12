import { useState } from 'react';
import { Modal, Button } from '@/components/common';
import { todoRepository } from '@/data/repositories';
import type { TodoItem } from '@/data/types';

interface TodoDetailModalProps {
  todo: TodoItem;
  onClose: () => void;
  onUpdate: (todo: TodoItem) => void;
  onDelete: () => void;
}

export default function TodoDetailModal({
  todo,
  onClose,
  onUpdate,
  onDelete,
}: TodoDetailModalProps) {
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleAddReminder = async () => {
    if (!reminderDate || !reminderTime) return;

    const scheduledAt = new Date(`${reminderDate}T${reminderTime}`).getTime();
    if (scheduledAt <= Date.now()) {
      alert('Please select a future date and time');
      return;
    }

    await todoRepository.addReminder(todo.id, scheduledAt);
    const updated = await todoRepository.getById(todo.id);
    if (updated) {
      onUpdate(updated);
    }
    setShowAddReminder(false);
    setReminderDate('');
    setReminderTime('09:00');
  };

  const handleRemoveReminder = async (reminderId: string) => {
    await todoRepository.removeReminder(todo.id, reminderId);
    const updated = await todoRepository.getById(todo.id);
    if (updated) {
      onUpdate(updated);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const pendingReminders = todo.reminders.filter((r) => !r.notified && r.scheduledAt > Date.now());
  const pastReminders = todo.reminders.filter((r) => r.notified || r.scheduledAt <= Date.now());

  return (
    <Modal isOpen onClose={onClose} title="Task Details">
      <div className="space-y-5">
        {/* Title */}
        <div>
          <p
            className={`text-lg ${
              todo.completed
                ? 'line-through text-ink-light/40 dark:text-ink-dark/40'
                : 'text-ink-light dark:text-ink-dark'
            }`}
          >
            {todo.title}
          </p>
          {todo.description && (
            <p className="text-sm text-ink-light/60 dark:text-ink-dark/60 mt-1">
              {todo.description}
            </p>
          )}
        </div>

        {/* Meta info */}
        <div className="space-y-2 text-sm text-ink-light/50 dark:text-ink-dark/50">
          <p>Created: {formatDate(todo.createdAt)}</p>
          {todo.dueDate && <p>Due: {formatDate(todo.dueDate)}</p>}
          {todo.completedAt && <p>Completed: {formatDate(todo.completedAt)}</p>}
        </div>

        {/* Reminders */}
        {!todo.completed && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-ink-light/70 dark:text-ink-dark/70">
                Reminders
              </h4>
              <button
                onClick={() => setShowAddReminder(true)}
                className="text-accent text-sm font-medium"
              >
                + Add
              </button>
            </div>

            {pendingReminders.length === 0 && !showAddReminder && (
              <p className="text-sm text-ink-light/40 dark:text-ink-dark/40">
                No reminders set
              </p>
            )}

            {pendingReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between py-2 border-b border-ink-light/10 dark:border-ink-dark/10"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔔</span>
                  <span className="text-sm text-ink-light dark:text-ink-dark">
                    {formatDateTime(reminder.scheduledAt)}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveReminder(reminder.id)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}

            {showAddReminder && (
              <div className="mt-3 p-3 bg-ink-light/5 dark:bg-ink-dark/5 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink-light/50 dark:text-ink-dark/50 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      min={today}
                      className="w-full px-2 py-1.5 text-sm rounded border border-ink-light/15 dark:border-ink-dark/15 bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-light/50 dark:text-ink-dark/50 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm rounded border border-ink-light/15 dark:border-ink-dark/15 bg-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddReminder(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddReminder}
                    disabled={!reminderDate}
                    className="flex-1"
                  >
                    Add Reminder
                  </Button>
                </div>
              </div>
            )}

            {pastReminders.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-ink-light/30 dark:text-ink-dark/30 mb-1">Past</p>
                {pastReminders.map((reminder) => (
                  <p key={reminder.id} className="text-xs text-ink-light/30 dark:text-ink-dark/30 line-through">
                    {formatDateTime(reminder.scheduledAt)}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-ink-light/10 dark:border-ink-dark/10">
          <Button variant="ghost" onClick={onDelete} className="text-red-500">
            Delete
          </Button>
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
