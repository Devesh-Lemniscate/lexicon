import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fileRepository, annotationRepository } from '@/data/repositories';
import { LoadingSpinner, Modal, Button } from '@/components/common';
import type { Annotation } from '@/data/types';

interface ExcalidrawData {
  type: string;
  version: number;
  elements: unknown[];
  appState?: Record<string, unknown>;
  files?: Record<string, unknown>;
}

export default function ExcalidrawViewer() {
  const { sourceId, '*': filePath = '' } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [data, setData] = useState<ExcalidrawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [existingNote, setExistingNote] = useState<Annotation | null>(null);
  const [saving, setSaving] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  
  // Touch state refs
  const touchState = useRef({
    initialDistance: 0,
    initialScale: 1,
    initialPosition: { x: 0, y: 0 },
    initialCenter: { x: 0, y: 0 },
    isPinching: false,
    isDragging: false,
    lastTouch: { x: 0, y: 0 },
  });
  
  // Mouse drag state
  const mouseState = useRef({
    isDragging: false,
    lastMouse: { x: 0, y: 0 },
  });
  
  // Use refs for scale/position to avoid stale closures in event handlers
  const scaleRef = useRef(scale);
  const positionRef = useRef(position);
  
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const fileName = filePath.split('/').pop() || 'Drawing';

  // Load file and existing note
  useEffect(() => {
    async function loadFile() {
      if (!sourceId || !filePath) {
        setError('Invalid file path');
        setLoading(false);
        return;
      }

      try {
        const content = await fileRepository.getContent(sourceId, filePath);
        if (!content?.content) {
          setError('File not found');
          setLoading(false);
          return;
        }

        const contentData = content.content;
        if (typeof contentData !== 'string') {
          setError('Invalid file format');
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(contentData);
        setData(parsed);
        
        // Generate SVG from Excalidraw data
        try {
          const { exportToSvg } = await import('@excalidraw/excalidraw');
          const svg = await exportToSvg({
            elements: parsed.elements || [],
            appState: {
              exportBackground: true,
              viewBackgroundColor: '#ffffff',
              ...parsed.appState,
            },
            files: parsed.files || {},
          });
          setSvgContent(svg.outerHTML);
        } catch (svgErr) {
          console.error('SVG export failed:', svgErr);
          // Fallback: show raw JSON preview
          setSvgContent(null);
        }

        // Load existing note for this file
        const notes = await annotationRepository.getByFile(sourceId, filePath);
        if (notes.length > 0) {
          setExistingNote(notes[0]);
          setNoteText(notes[0].note);
        }
      } catch (err) {
        console.error('Failed to load Excalidraw file:', err);
        setError('Failed to load drawing. The file may be corrupted.');
      } finally {
        setLoading(false);
      }
    }

    loadFile();
  }, [sourceId, filePath]);

  // Pinch zoom and pan handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getCenter = (touches: TouchList) => ({
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        touchState.current.isPinching = true;
        touchState.current.isDragging = false;
        touchState.current.initialDistance = getDistance(e.touches);
        touchState.current.initialScale = scaleRef.current;
        touchState.current.initialPosition = { ...positionRef.current };
        touchState.current.initialCenter = getCenter(e.touches);
      } else if (e.touches.length === 1) {
        touchState.current.isDragging = true;
        touchState.current.isPinching = false;
        touchState.current.lastTouch = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchState.current.isPinching) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const newScale = Math.min(Math.max(0.01, touchState.current.initialScale * (currentDistance / touchState.current.initialDistance)), 10);
        setScale(newScale);
        
        // Pan with pinch
        const currentCenter = getCenter(e.touches);
        const dx = currentCenter.x - touchState.current.initialCenter.x;
        const dy = currentCenter.y - touchState.current.initialCenter.y;
        setPosition({
          x: touchState.current.initialPosition.x + dx,
          y: touchState.current.initialPosition.y + dy,
        });
      } else if (e.touches.length === 1 && touchState.current.isDragging) {
        e.preventDefault();
        const dx = e.touches[0].clientX - touchState.current.lastTouch.x;
        const dy = e.touches[0].clientY - touchState.current.lastTouch.y;
        setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        touchState.current.lastTouch = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const handleTouchEnd = () => {
      touchState.current.isPinching = false;
      touchState.current.isDragging = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    // Mouse wheel zoom
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Smoother zoom with reduced sensitivity
      const currentScale = scaleRef.current;
      const factor = 0.05; // Reduced from 0.15 for gentler zoom
      const delta = e.deltaY > 0 ? -factor * currentScale : factor * currentScale;
      setScale(prev => Math.min(Math.max(0.1, prev + delta), 10));
    };

    // Mouse drag
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click only
        e.preventDefault();
        mouseState.current.isDragging = true;
        mouseState.current.lastMouse = { x: e.clientX, y: e.clientY };
        container.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (mouseState.current.isDragging) {
        e.preventDefault();
        const dx = e.clientX - mouseState.current.lastMouse.x;
        const dy = e.clientY - mouseState.current.lastMouse.y;
        setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        mouseState.current.lastMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      mouseState.current.isDragging = false;
      container.style.cursor = 'grab';
    };

    const handleMouseLeave = () => {
      mouseState.current.isDragging = false;
      container.style.cursor = 'grab';
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.style.cursor = 'grab';

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [loading]); // Re-attach when loading completes

  const handleBack = () => {
    navigate(-1);
  };

  const handleDoubleTap = () => {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleSaveNote = async () => {
    if (!sourceId || !filePath || !noteText.trim()) return;
    
    setSaving(true);
    try {
      if (existingNote) {
        // Update existing note
        const updated = await annotationRepository.update(existingNote.id, noteText.trim());
        if (updated) setExistingNote(updated);
      } else {
        // Create new note
        const newNote = await annotationRepository.create({
          sourceId,
          filePath,
          note: noteText.trim(),
        });
        setExistingNote(newNote);
      }
      setShowNoteModal(false);
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!existingNote) return;
    
    try {
      await annotationRepository.delete(existingNote.id);
      setExistingNote(null);
      setNoteText('');
      setShowNoteModal(false);
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-paper-light dark:bg-paper-dark flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-ink-light dark:text-ink-dark mb-2">
            Unable to load drawing
          </h2>
          <p className="text-sm text-muted-light dark:text-muted-dark mb-6">
            {error || 'Something went wrong while loading this file.'}
          </p>
          <button 
            onClick={handleBack} 
            className="px-6 py-2 bg-accent text-white rounded-full font-medium"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm safe-top border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-400"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate mx-4 flex-1 text-center">
            {fileName}
          </h1>
          <button
            onClick={() => setShowNoteModal(true)}
            className={`p-2 -mr-2 ${existingNote ? 'text-accent' : 'text-gray-600 dark:text-gray-400'}`}
            aria-label="Add note"
          >
            <svg className="w-5 h-5" fill={existingNote ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Zoom indicator */}
      {scale !== 1 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-black/60 text-white text-xs rounded-full">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Drawing canvas with pinch zoom */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden touch-none"
        onDoubleClick={handleDoubleTap}
      >
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: touchState.current.isPinching || touchState.current.isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          {svgContent ? (
            <div 
              className="max-w-full max-h-full"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : data ? (
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
              </div>
              <h3 className="font-medium text-ink-light dark:text-ink-dark mb-2">{fileName}</h3>
              <p className="text-sm text-muted-light dark:text-muted-dark">
                {(data as any).elements?.length || 0} elements
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/50 text-white/80 text-xs rounded-full pointer-events-none safe-bottom">
        Scroll to zoom • Drag to pan • Double-click to reset
      </div>

      {/* Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title={existingNote ? 'Edit Note' : 'Add Note'}
      >
        <div className="space-y-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write your note about this drawing..."
            className="w-full h-32 px-3 py-2 bg-paper-light dark:bg-paper-dark border border-ink-light/10 dark:border-ink-dark/10 rounded-lg text-ink-light dark:text-ink-dark placeholder:text-muted-light dark:placeholder:text-muted-dark resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
            autoFocus
          />
          <div className="flex gap-3">
            {existingNote && (
              <Button variant="danger" onClick={handleDeleteNote} className="flex-1">
                Delete
              </Button>
            )}
            <Button 
              variant="secondary" 
              onClick={() => setShowNoteModal(false)} 
              className={existingNote ? '' : 'flex-1'}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNote} 
              disabled={!noteText.trim() || saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
