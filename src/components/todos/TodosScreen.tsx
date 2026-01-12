import { useState, useEffect, useCallback } from 'react';
import { todoRepository } from '@/data/repositories';
import type { TodoItem } from '@/data/types';
import { LoadingSpinner } from '@/components/common';
import TodoItemRow from './TodoItemRow';
import AddTodoModal from './AddTodoModal';
import TodoDetailModal from './TodoDetailModal';

export default function TodosScreen() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadTodos = useCallback(async () => {
    try {
      const items = await todoRepository.getAll();
      setTodos(items);
    } catch (err) {
      console.error('Failed to load todos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleToggleComplete = async (id: string) => {
    const updated = await todoRepository.toggleComplete(id);
    if (updated) {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? updated : t)).sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return b.createdAt - a.createdAt;
        })
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      await todoRepository.delete(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      // Auto-cancel after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleAddTodo = async (title: string, dueDate?: number) => {
    const todo = await todoRepository.create({ title, dueDate });
    setTodos((prev) => [todo, ...prev]);
    setShowAddModal(false);
  };

  const handleTodoUpdated = (updated: TodoItem) => {
    setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTodo(null);
  };

  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark pb-24">
      {/* Header */}
      <div className="safe-top pt-6 px-5 pb-4">
        <h1 className="text-xl font-semibold text-ink-light dark:text-ink-dark">Tasks</h1>
      </div>

      {todos.length === 0 ? (
        <div className="px-5">
          {/* Add first task button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-4 flex items-center justify-center gap-2 text-accent border-2 border-dashed border-accent/30 rounded-xl hover:bg-accent/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">Add your first task</span>
          </button>
        </div>
      ) : (
        <div className="px-5">
          {/* Active todos */}
          {activeTodos.length > 0 && (
            <div className="mb-4">
              {activeTodos.map((todo) => (
                <TodoItemRow
                  key={todo.id}
                  todo={todo}
                  onToggle={() => handleToggleComplete(todo.id)}
                  onDelete={() => handleDelete(todo.id)}
                  onTap={() => setSelectedTodo(todo)}
                  isDeleteConfirm={deleteConfirm === todo.id}
                />
              ))}
            </div>
          )}

          {/* Add task button - always visible below tasks */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-3 flex items-center justify-center gap-2 text-muted-light dark:text-muted-dark border border-dashed border-ink-light/10 dark:border-ink-dark/10 rounded-lg hover:bg-ink-light/5 dark:hover:bg-ink-dark/5 transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm">Add a task</span>
          </button>

          {/* Completed section */}
          {completedTodos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium uppercase tracking-wider text-ink-light/40 dark:text-ink-dark/40">
                  Completed ({completedTodos.length})
                </h3>
              </div>
              {completedTodos.map((todo) => (
                <TodoItemRow
                  key={todo.id}
                  todo={todo}
                  onToggle={() => handleToggleComplete(todo.id)}
                  onDelete={() => handleDelete(todo.id)}
                  onTap={() => setSelectedTodo(todo)}
                  isDeleteConfirm={deleteConfirm === todo.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Todo Modal */}
      <AddTodoModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTodo}
      />

      {/* Todo Detail Modal */}
      {selectedTodo && (
        <TodoDetailModal
          todo={selectedTodo}
          onClose={() => setSelectedTodo(null)}
          onUpdate={handleTodoUpdated}
          onDelete={() => {
            handleDelete(selectedTodo.id);
            setSelectedTodo(null);
          }}
        />
      )}
    </div>
  );
}
