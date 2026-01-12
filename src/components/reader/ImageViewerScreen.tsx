import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fileRepository, imageAnnotationRepository } from '@/data/repositories';
import { LoadingSpinner, Button, Modal, TextArea } from '@/components/common';
import type { ImageAnnotation } from '@/data/types';

export default function ImageViewerScreen() {
  const { sourceId, '*': filePath = '' } = useParams();
  const navigate = useNavigate();
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [annotation, setAnnotation] = useState<ImageAnnotation | null>(null);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Zoom/pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastPosition = useRef({ x: 0, y: 0 });

  const fileName = filePath.split('/').pop() || 'Image';

  useEffect(() => {
    async function loadImage() {
      if (!sourceId || !filePath) {
        setError('Invalid file path');
        setLoading(false);
        return;
      }

      try {
        // Load image from IndexedDB or fetch
        const content = await fileRepository.getContent(sourceId, filePath);
        const contentData = content?.content;
        if (contentData) {
          // If it's a data URL or blob
          if (typeof contentData === 'string') {
            setImageUrl(contentData);
          } else {
            // Convert Blob to URL
            setImageUrl(URL.createObjectURL(contentData));
          }
        } else {
          // Try to construct URL from GitHub
          const source = await fileRepository.getByPath(sourceId, filePath);
          if (source) {
            // For GitHub, we'd need the raw URL
            setError('Image not cached locally');
          } else {
            setError('Image not found');
          }
        }

        // Load annotation if exists
        const existingAnnotation = await imageAnnotationRepository.getByFile(sourceId, filePath);
        if (existingAnnotation) {
          setAnnotation(existingAnnotation);
          setNoteText(existingAnnotation.note);
        }
      } catch (err) {
        console.error('Failed to load image:', err);
        setError('Failed to load image');
      } finally {
        setLoading(false);
      }
    }

    loadImage();
  }, [sourceId, filePath]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSaveAnnotation = async () => {
    if (!sourceId || !filePath) return;

    try {
      const saved = await imageAnnotationRepository.upsert(sourceId, filePath, noteText.trim());
      setAnnotation(saved);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save annotation:', err);
    }
  };

  const handleDeleteAnnotation = async () => {
    if (!annotation) return;

    try {
      await imageAnnotationRepository.delete(annotation.id);
      setAnnotation(null);
      setNoteText('');
      setShowAnnotation(false);
    } catch (err) {
      console.error('Failed to delete annotation:', err);
    }
  };

  // Touch/mouse handlers for pan
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastPosition.current = position;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [scale, position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition({
      x: lastPosition.current.x + dx,
      y: lastPosition.current.y + dy,
    });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Double-tap to zoom
  const lastTap = useRef(0);
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap - toggle zoom
      if (scale > 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(2);
      }
    }
    lastTap.current = now;
  }, [scale]);

  // Pinch zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 1), 5));
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !imageUrl) {
    return (
      <div className="min-h-screen bg-paper-light dark:bg-paper-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-light dark:text-muted-dark mb-4">{error || 'No image'}</p>
          <button onClick={handleBack} className="text-accent">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-black/70 backdrop-blur-sm safe-top">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-white/80"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-sm font-medium text-white/90 truncate mx-4">
            {fileName}
          </h1>
          <button
            onClick={() => setShowAnnotation(true)}
            className="p-2 text-white/80"
            aria-label="Notes"
          >
            <svg className="w-5 h-5" fill={annotation ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Image container */}
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleTap}
        onWheel={handleWheel}
        style={{ touchAction: scale > 1 ? 'none' : 'pan-y' }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt={fileName}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          draggable={false}
        />
      </div>

      {/* Zoom indicator */}
      {scale > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Annotation indicator */}
      {annotation && !showAnnotation && (
        <button
          onClick={() => setShowAnnotation(true)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-accent text-white text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-lg"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          View Note
        </button>
      )}

      {/* Annotation Modal */}
      <Modal
        isOpen={showAnnotation}
        onClose={() => {
          setShowAnnotation(false);
          setIsEditing(false);
          if (annotation) setNoteText(annotation.note);
        }}
        title="Image Note"
      >
        {isEditing ? (
          <div className="space-y-4">
            <TextArea
              label="Note"
              placeholder="Add your thoughts about this image..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={5}
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  if (annotation) setNoteText(annotation.note);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAnnotation} className="flex-1">
                Save
              </Button>
            </div>
          </div>
        ) : annotation ? (
          <div className="space-y-4">
            <p className="text-ink-light dark:text-ink-dark whitespace-pre-wrap">
              {annotation.note}
            </p>
            <p className="text-xs text-muted-light dark:text-muted-dark">
              Added {new Date(annotation.createdAt).toLocaleDateString()}
            </p>
            <div className="flex gap-3 pt-2 border-t border-ink-light/10 dark:border-ink-dark/10">
              <Button variant="ghost" onClick={handleDeleteAnnotation} className="flex-1 text-red-500">
                Delete
              </Button>
              <Button onClick={() => setIsEditing(true)} className="flex-1">
                Edit
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <TextArea
              label="Note"
              placeholder="Add your thoughts about this image..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={5}
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowAnnotation(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAnnotation} 
                disabled={!noteText.trim()}
                className="flex-1"
              >
                Save Note
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
