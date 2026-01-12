import { useState } from 'react';
import { Modal, Button, TextArea } from '@/components/common';
import { annotationRepository } from '@/data/repositories';
import type { TocItem } from '@/data/types';

interface AnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceId: string;
  filePath: string;
  heading: TocItem | null;
}

export default function AnnotationModal({
  isOpen,
  onClose,
  sourceId,
  filePath,
  heading,
}: AnnotationModalProps) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!note.trim()) return;

    setSaving(true);
    try {
      await annotationRepository.create({
        sourceId,
        filePath,
        headingId: heading?.id,
        note: note.trim(),
      });
      setNote('');
      onClose();
    } catch (err) {
      console.error('Failed to save annotation:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Note">
      <div className="space-y-4">
        {heading && (
          <div className="py-2 border-l-2 border-accent/40 pl-3">
            <p className="text-xs text-ink-light/50 dark:text-ink-dark/50 mb-0.5">At section</p>
            <p className="text-sm text-ink-light dark:text-ink-dark">{heading.text}</p>
          </div>
        )}

        <TextArea
          label="Your note"
          placeholder="Write your thoughts..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          autoFocus
        />

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={!note.trim()} className="flex-1">
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
