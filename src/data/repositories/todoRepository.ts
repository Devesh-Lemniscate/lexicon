import { getDatabase } from '../db';
import type { TodoItem, TodoReminder } from '../types';

function generateId(): string {
  return `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateReminderId(): string {
  return `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const todoRepository = {
  async getAll(): Promise<TodoItem[]> {
    const db = await getDatabase();
    const todos = await db.getAll('todos');
    // Sort: incomplete first (by due date), then completed (by completed date)
    return todos.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (a.completed) {
        return (b.completedAt || 0) - (a.completedAt || 0);
      }
      if (a.dueDate && b.dueDate) {
        return a.dueDate - b.dueDate;
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt - a.createdAt;
    });
  },

  async getById(id: string): Promise<TodoItem | undefined> {
    const db = await getDatabase();
    return db.get('todos', id);
  },

  async create(data: Omit<TodoItem, 'id' | 'createdAt' | 'completed' | 'reminders'>): Promise<TodoItem> {
    const db = await getDatabase();
    const todo: TodoItem = {
      id: generateId(),
      title: data.title,
      description: data.description,
      completed: false,
      createdAt: Date.now(),
      dueDate: data.dueDate,
      reminders: [],
    };
    await db.put('todos', todo);
    return todo;
  },

  async update(id: string, updates: Partial<TodoItem>): Promise<TodoItem | undefined> {
    const db = await getDatabase();
    const existing = await db.get('todos', id);
    if (!existing) return undefined;

    const updated: TodoItem = { ...existing, ...updates };
    await db.put('todos', updated);
    return updated;
  },

  async toggleComplete(id: string): Promise<TodoItem | undefined> {
    const db = await getDatabase();
    const existing = await db.get('todos', id);
    if (!existing) return undefined;

    const updated: TodoItem = {
      ...existing,
      completed: !existing.completed,
      completedAt: !existing.completed ? Date.now() : undefined,
    };
    await db.put('todos', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('todos', id);
  },

  async addReminder(todoId: string, scheduledAt: number): Promise<TodoReminder | undefined> {
    const db = await getDatabase();
    const todo = await db.get('todos', todoId);
    if (!todo) return undefined;

    const reminder: TodoReminder = {
      id: generateReminderId(),
      scheduledAt,
      notified: false,
    };

    const updated: TodoItem = {
      ...todo,
      reminders: [...todo.reminders, reminder],
    };
    await db.put('todos', updated);
    return reminder;
  },

  async removeReminder(todoId: string, reminderId: string): Promise<void> {
    const db = await getDatabase();
    const todo = await db.get('todos', todoId);
    if (!todo) return;

    const updated: TodoItem = {
      ...todo,
      reminders: todo.reminders.filter((r) => r.id !== reminderId),
    };
    await db.put('todos', updated);
  },

  async markReminderNotified(todoId: string, reminderId: string): Promise<void> {
    const db = await getDatabase();
    const todo = await db.get('todos', todoId);
    if (!todo) return;

    const updated: TodoItem = {
      ...todo,
      reminders: todo.reminders.map((r) =>
        r.id === reminderId ? { ...r, notified: true } : r
      ),
    };
    await db.put('todos', updated);
  },

  async getPendingReminders(): Promise<Array<{ todo: TodoItem; reminder: TodoReminder }>> {
    const db = await getDatabase();
    const todos = await db.getAll('todos');
    const now = Date.now();
    const pending: Array<{ todo: TodoItem; reminder: TodoReminder }> = [];

    for (const todo of todos) {
      if (todo.completed) continue;
      for (const reminder of todo.reminders) {
        if (!reminder.notified && reminder.scheduledAt <= now) {
          pending.push({ todo, reminder });
        }
      }
    }

    return pending.sort((a, b) => a.reminder.scheduledAt - b.reminder.scheduledAt);
  },

  async deleteCompleted(): Promise<number> {
    const db = await getDatabase();
    const todos = await db.getAll('todos');
    const completed = todos.filter((t) => t.completed);
    
    for (const todo of completed) {
      await db.delete('todos', todo.id);
    }
    
    return completed.length;
  },
};
