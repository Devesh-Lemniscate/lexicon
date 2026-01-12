import { useState, useEffect, useCallback } from 'react';
import { ideaRepository } from '@/data/repositories';
import type { Idea } from '@/data/types';
import { LoadingSpinner, EmptyState } from '@/components/common';
import IdeaCard from './IdeaCard';
import AddIdeaModal from './AddIdeaModal';
import IdeaDetailModal from './IdeaDetailModal';
import IdeasSearch from './IdeasSearch';

export default function IdeasScreen() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Idea[] | null>(null);

  const loadIdeas = useCallback(async () => {
    try {
      const items = await ideaRepository.getAll();
      setIdeas(items);
    } catch (err) {
      console.error('Failed to load ideas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    const results = await ideaRepository.search(query);
    setSearchResults(results);
  };

  const handleAddIdea = async (title: string, content: string) => {
    const idea = await ideaRepository.create({ title, content });
    setIdeas((prev) => [idea, ...prev]);
    setShowAddModal(false);
  };

  const handleUpdateIdea = async (id: string, title: string, content: string) => {
    const updated = await ideaRepository.update(id, { title, content });
    if (updated) {
      setIdeas((prev) => prev.map((i) => (i.id === id ? updated : i)));
    }
    setSelectedIdea(null);
  };

  const handleDeleteIdea = async (id: string) => {
    await ideaRepository.delete(id);
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    setSelectedIdea(null);
  };

  const displayIdeas = searchResults ?? ideas;

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark pb-20">
      {/* Header with search */}
      <div className="safe-top pt-6 px-5 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">💡</div>
          <h1 className="text-xl font-semibold text-ink-light dark:text-ink-dark">Ideas</h1>
        </div>

        <IdeasSearch value={searchQuery} onChange={handleSearch} />
      </div>

      {ideas.length === 0 && !searchQuery ? (
        <div className="px-5">
          {/* Add first idea button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-4 flex items-center justify-center gap-2 text-accent border-2 border-dashed border-accent/30 rounded-xl hover:bg-accent/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">Capture your first idea</span>
          </button>
        </div>
      ) : displayIdeas.length === 0 && searchQuery ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          title="No matches"
          description={`No ideas found for "${searchQuery}"`}
        />
      ) : (
        <div className="px-5">
          <div className="space-y-3 mb-4">
            {displayIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onClick={() => setSelectedIdea(idea)}
              />
            ))}
          </div>

          {/* Add idea button - always visible below ideas */}
          {!searchQuery && (
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full py-3 flex items-center justify-center gap-2 text-muted-light dark:text-muted-dark border border-dashed border-ink-light/10 dark:border-ink-dark/10 rounded-lg hover:bg-ink-light/5 dark:hover:bg-ink-dark/5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm">Add an idea</span>
            </button>
          )}
        </div>
      )}

      {/* Add Idea Modal */}
      <AddIdeaModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddIdea}
      />

      {/* Idea Detail Modal */}
      <IdeaDetailModal
        idea={selectedIdea}
        isOpen={!!selectedIdea}
        onClose={() => setSelectedIdea(null)}
        onUpdate={handleUpdateIdea}
        onDelete={(id) => handleDeleteIdea(id)}
      />
    </div>
  );
}
