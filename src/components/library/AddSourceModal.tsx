import { useState } from 'react';
import { Modal, Button, Input } from '@/components/common';
import { useSourcesStore } from '@/store';
import { githubApi } from '@/services/github';

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddSourceModal({ isOpen, onClose }: AddSourceModalProps) {
  const { addSource, syncSource } = useSourcesStore();

  const [form, setForm] = useState({
    name: '',
    owner: '',
    repo: '',
    branch: 'main',
    visibility: 'public' as 'public' | 'private',
    authToken: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate repository exists
      const isValid = await githubApi.validateRepository({
        owner: form.owner,
        repo: form.repo,
        token: form.visibility === 'private' ? form.authToken : undefined,
      });

      if (!isValid) {
        setError('Repository not found or access denied. Check the details and try again.');
        setLoading(false);
        return;
      }

      // Create source
      const source = await addSource({
        name: form.name || `${form.owner}/${form.repo}`,
        owner: form.owner,
        repo: form.repo,
        branch: form.branch || 'main',
        visibility: form.visibility,
        authToken: form.visibility === 'private' ? form.authToken : undefined,
      });

      // Close modal and trigger initial sync
      onClose();
      resetForm();
      await syncSource(source.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add source';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      owner: '',
      repo: '',
      branch: 'main',
      visibility: 'public',
      authToken: '',
    });
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Source">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border-l-2 border-red-500 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <Input
          label="Repository Owner"
          placeholder="e.g., octocat"
          value={form.owner}
          onChange={(e) => setForm({ ...form, owner: e.target.value })}
          required
        />

        <Input
          label="Repository Name"
          placeholder="e.g., my-notes"
          value={form.repo}
          onChange={(e) => setForm({ ...form, repo: e.target.value })}
          required
        />

        <Input
          label="Display Name (optional)"
          placeholder="e.g., My Notes"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <Input
          label="Branch"
          placeholder="main"
          value={form.branch}
          onChange={(e) => setForm({ ...form, branch: e.target.value })}
        />

        <div>
          <label className="block text-sm font-medium mb-2 text-ink-light/70 dark:text-ink-dark/70">
            Visibility
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={form.visibility === 'public'}
                onChange={() => setForm({ ...form, visibility: 'public', authToken: '' })}
                className="w-4 h-4 text-accent focus:ring-accent border-ink-light/20"
              />
              <span className="text-sm text-ink-light dark:text-ink-dark">Public</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={form.visibility === 'private'}
                onChange={() => setForm({ ...form, visibility: 'private' })}
                className="w-4 h-4 text-accent focus:ring-accent border-ink-light/20"
              />
              <span className="text-sm text-ink-light dark:text-ink-dark">Private</span>
            </label>
          </div>
        </div>

        {form.visibility === 'private' && (
          <div>
            <Input
              label="GitHub Token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              value={form.authToken}
              onChange={(e) => setForm({ ...form, authToken: e.target.value })}
              required
            />
            <p className="mt-1.5 text-xs text-ink-light/50 dark:text-ink-dark/50">
              Use a fine-grained token with read-only access to repository contents.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Add Source
          </Button>
        </div>
      </form>
    </Modal>
  );
}
