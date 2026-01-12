import { useState } from 'react';
import { Modal, Button, Input, TextArea } from '@/components/common';

interface AddIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, content: string) => void;
}

export default function AddIdeaModal({ isOpen, onClose, onAdd }: AddIdeaModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onAdd(title.trim(), content.trim());
    setTitle('');
    setContent('');
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Idea">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          placeholder="What's this idea about?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        <TextArea
          label="Details"
          placeholder="Write your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          required
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim() || !content.trim()} className="flex-1">
            Save Idea
          </Button>
        </div>
      </form>
    </Modal>
  );
}
