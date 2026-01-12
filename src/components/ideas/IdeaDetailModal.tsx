import { useState, useEffect } from 'react';
import { Modal, Button, Input, TextArea } from '@/components/common';
import type { Idea } from '@/data/types';

interface IdeaDetailModalProps {
  idea: Idea | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, title: string, content: string) => void;
  onDelete: (id: string) => void;
}

export default function IdeaDetailModal({ 
  idea, 
  isOpen, 
  onClose, 
  onUpdate,
  onDelete 
}: IdeaDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setContent(idea.content);
    }
  }, [idea]);

  const handleClose = () => {
    setIsEditing(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleSave = () => {
    if (!idea || !title.trim() || !content.trim()) return;
    onUpdate(idea.id, title.trim(), content.trim());
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!idea) return;
    onDelete(idea.id);
    handleClose();
  };

  const formatDate = (date: Date | number) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!idea) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? 'Edit Idea' : idea.title}>
      <div className="space-y-4">
        {showDeleteConfirm ? (
          <div className="space-y-4">
            <p className="text-center text-ink/70 dark:text-ink-dark/70">
              Are you sure you want to delete this idea? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowDeleteConfirm(false)} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDelete} 
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        ) : isEditing ? (
          <>
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />

            <TextArea
              label="Details"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />

            <div className="flex gap-3 pt-2">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsEditing(false);
                  setTitle(idea.title);
                  setContent(idea.content);
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!title.trim() || !content.trim()}
                className="flex-1"
              >
                Save
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-ink/50 dark:text-ink-dark/50">
              Created {formatDate(idea.createdAt)}
              {idea.updatedAt && idea.updatedAt !== idea.createdAt && (
                <> · Updated {formatDate(idea.updatedAt)}</>
              )}
            </p>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-ink/80 dark:text-ink-dark/80 whitespace-pre-wrap">
                {idea.content}
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-ink/10 dark:border-ink-dark/10">
              <Button 
                variant="ghost" 
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 text-red-500"
              >
                Delete
              </Button>
              <Button 
                onClick={() => setIsEditing(true)}
                className="flex-1"
              >
                Edit
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
