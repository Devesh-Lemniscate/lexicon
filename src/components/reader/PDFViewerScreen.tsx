import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { fileRepository, readingProgressRepository, annotationRepository } from '@/data/repositories';
import { LoadingSpinner, Modal, Button } from '@/components/common';
import type { Annotation } from '@/data/types';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PDFAnnotation extends Annotation {
  pageNumber?: number;
}

interface PageDimensions {
  width: number;
  height: number;
}

// Memoized page component to prevent unnecessary re-renders
interface PDFPageProps {
  pageNum: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  baseScale: number;
  scale: number;
  dimensions: PageDimensions | undefined;
  annotationCount: number;
  onCanvasRef: (num: number, canvas: HTMLCanvasElement | null) => void;
}

const PDFPage = memo(function PDFPage({ 
  pageNum, 
  pdfDoc, 
  baseScale, 
  scale, 
  dimensions, 
  annotationCount,
  onCanvasRef 
}: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderedScaleRef = useRef<number>(0);
  const renderingRef = useRef(false);

  const pageWidth = dimensions ? dimensions.width * scale : 300;
  const pageHeight = dimensions ? dimensions.height * scale : 400;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pdfDoc) return;

    const effectiveScale = baseScale * scale;
    if (renderedScaleRef.current === effectiveScale) return;
    if (renderingRef.current) return;

    renderingRef.current = true;

    (async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const viewport = page.getViewport({ scale: effectiveScale });
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = viewport.width + 'px';
        canvas.style.height = viewport.height + 'px';

        ctx.scale(dpr, dpr);
        await page.render({ canvasContext: ctx, viewport }).promise;
        renderedScaleRef.current = effectiveScale;
      } catch (e) {
        console.error('Render error page', pageNum, e);
      } finally {
        renderingRef.current = false;
      }
    })();
  }, [pageNum, pdfDoc, baseScale, scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    onCanvasRef(pageNum, canvas);
    return () => onCanvasRef(pageNum, null);
  }, [pageNum, onCanvasRef]);

  return (
    <div className="relative mb-4" data-page={pageNum} style={{ minWidth: pageWidth, minHeight: pageHeight }}>
      {annotationCount > 0 && (
        <div className="absolute -top-1 right-2 z-10 px-2 py-0.5 bg-accent/90 rounded-full">
          <span className="text-xs text-white font-medium">{annotationCount} note{annotationCount > 1 ? 's' : ''}</span>
        </div>
      )}
      <canvas ref={canvasRef} className="bg-white shadow-lg" style={{ maxWidth: '100%' }} />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props change
  return (
    prevProps.pageNum === nextProps.pageNum &&
    prevProps.pdfDoc === nextProps.pdfDoc &&
    prevProps.baseScale === nextProps.baseScale &&
    prevProps.scale === nextProps.scale &&
    prevProps.annotationCount === nextProps.annotationCount &&
    prevProps.dimensions?.width === nextProps.dimensions?.width &&
    prevProps.dimensions?.height === nextProps.dimensions?.height
  );
});

export default function PDFViewerScreen() {
  const { sourceId, '*': filePath = '' } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMapRef = useRef<Map<number, HTMLCanvasElement>>(new Map());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [annotations, setAnnotations] = useState<PDFAnnotation[]>([]);
  const [annotationNote, setAnnotationNote] = useState('');
  const [savingAnnotation, setSavingAnnotation] = useState(false);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const [savedPageNum, setSavedPageNum] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [pageDimensions, setPageDimensions] = useState<PageDimensions[]>([]);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  const pinchRef = useRef({ distance: 0, active: false });
  const lastTapRef = useRef(0);
  const zoomTimeoutRef = useRef<number>();

  const fileName = useMemo(() => filePath.split('/').pop() || 'Document', [filePath]);

  // Stable callback for canvas refs
  const handleCanvasRef = useCallback((num: number, canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      canvasMapRef.current.set(num, canvas);
    } else {
      canvasMapRef.current.delete(num);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    
    async function load() {
      if (!sourceId || !filePath) {
        setError('Invalid path');
        setLoading(false);
        return;
      }
      try {
        const content = await fileRepository.getContent(sourceId, filePath);
        if (!content?.content) {
          setError('PDF not found');
          setLoading(false);
          return;
        }
        
        let buffer: ArrayBuffer;
        if (content.content instanceof Blob) {
          buffer = await content.content.arrayBuffer();
        } else if (typeof content.content === 'string') {
          const b64 = content.content.includes(',') ? content.content.split(',')[1] : content.content;
          const bin = atob(b64);
          const arr = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          buffer = arr.buffer;
        } else {
          throw new Error('Invalid content');
        }
        
        if (cancelled) return;
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        if (cancelled) { pdf.destroy(); return; }
        
        pdfDocRef.current = pdf;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        
        const container = containerRef.current;
        let calculatedBaseScale = 1;
        if (container) {
          const p1 = await pdf.getPage(1);
          const vp = p1.getViewport({ scale: 1 });
          calculatedBaseScale = (container.clientWidth - 16) / vp.width;
          setBaseScale(calculatedBaseScale);
        }
        
        // Pre-calculate all page dimensions for stable layout
        const dims: PageDimensions[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: calculatedBaseScale });
          dims.push({ width: viewport.width, height: viewport.height });
        }
        setPageDimensions(dims);
        
        const progress = await readingProgressRepository.get(sourceId, filePath);
        if (progress && progress.offsetPercent && progress.offsetPercent > 0) {
          const pg = Math.round(progress.offsetPercent * 100);
          if (pg >= 1 && pg <= pdf.numPages) {
            setCurrentPage(pg);
            setSavedPageNum(pg);
          }
        }
        
        const annots = await annotationRepository.getByFile(sourceId, filePath);
        setAnnotations(annots as PDFAnnotation[]);
        setLoading(false);
        setIsReady(true);
      } catch (e) {
        console.error('Load error', e);
        if (!cancelled) {
          setError('Failed to load PDF');
          setLoading(false);
        }
      }
    }
    
    load();
    return () => { cancelled = true; pdfDocRef.current?.destroy(); };
  }, [sourceId, filePath]);

  useEffect(() => {
    if (!isReady || savedPageNum <= 1 || !pdfDoc) return;
    
    // Simple scroll to saved page after a delay
    const t = setTimeout(() => {
      const container = containerRef.current;
      if (!container) {
        setHasRestoredProgress(true);
        return;
      }
      const pageEl = container.querySelector(`[data-page="${savedPageNum}"]`);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
      // Mark as restored so we can start saving progress
      setHasRestoredProgress(true);
    }, 300);
    
    return () => clearTimeout(t);
  }, [isReady, savedPageNum, pdfDoc]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !totalPages) return;
    
    const containerRect = container.getBoundingClientRect();
    const targetY = containerRect.top + containerRect.height / 3;
    
    // Find which page is at the target position
    let found = 1;
    for (let i = 1; i <= totalPages; i++) {
      const pageEl = container.querySelector(`[data-page="${i}"]`);
      if (pageEl) {
        const rect = pageEl.getBoundingClientRect();
        if (rect.bottom > targetY) {
          found = i;
          break;
        }
      }
    }
    
    if (currentPage !== found) setCurrentPage(found);
  }, [totalPages, currentPage]);

  const saveProgress = useCallback(() => {
    if (!sourceId || !filePath || currentPage < 1) return;
    readingProgressRepository.save({
      sourceId, filePath,
      offsetPercent: currentPage / 100,
      lastReadAt: Date.now()
    });
  }, [sourceId, filePath, currentPage]);

  // Only save progress AFTER we've restored from saved position
  useEffect(() => {
    if (!hasRestoredProgress) return;
    if (currentPage > 0 && totalPages > 0) saveProgress();
  }, [currentPage, totalPages, saveProgress, hasRestoredProgress]);

  const showZoom = useCallback(() => {
    setShowZoomIndicator(true);
    if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    zoomTimeoutRef.current = window.setTimeout(() => setShowZoomIndicator(false), 800);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { distance: Math.sqrt(dx*dx + dy*dy), active: true };
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) { setScale(1); showZoom(); }
      lastTapRef.current = now;
    }
  }, [showZoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current.active) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (pinchRef.current.distance > 0) {
        const ratio = dist / pinchRef.current.distance;
        const damped = 1 + (ratio - 1) * 0.25;
        setScale(s => Math.min(Math.max(s * damped, 0.8), 3));
        showZoom();
      }
      pinchRef.current.distance = dist;
    }
  }, [showZoom]);

  const handleTouchEnd = useCallback(() => {
    pinchRef.current = { distance: 0, active: false };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setScale(s => Math.min(Math.max(s * (e.deltaY > 0 ? 0.97 : 1.03), 0.8), 3));
      showZoom();
    }
  }, [showZoom]);

  const handleBack = () => { saveProgress(); navigate(-1); };
  
  const handleTap = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('button')) setShowControls(v => !v);
  };

  const handleSaveAnnotation = async () => {
    if (!annotationNote.trim() || !sourceId || !filePath) return;
    setSavingAnnotation(true);
    try {
      const a = await annotationRepository.create({
        sourceId, filePath,
        headingId: 'page-' + currentPage,
        paragraphIndex: currentPage,
        note: annotationNote.trim()
      });
      setAnnotations(prev => [...prev, a as PDFAnnotation]);
      setAnnotationNote('');
      setShowAnnotationModal(false);
    } finally { setSavingAnnotation(false); }
  };

  const getPageAnnotationCount = useCallback((n: number) => {
    return annotations.filter(a => a.paragraphIndex === n || a.headingId === 'page-' + n).length;
  }, [annotations]);

  if (loading) return (
    <div className="fixed inset-0 bg-[#1c1c1e] flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-white/60 text-sm">Loading...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="fixed inset-0 bg-[#1c1c1e] flex items-center justify-center">
      <div className="text-center px-6">
        <p className="text-white/60 mb-4">{error}</p>
        <button onClick={handleBack} className="text-accent font-medium">Go back</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#1c1c1e] flex flex-col">
      <header className={'absolute top-0 left-0 right-0 z-30 bg-black/70 backdrop-blur-md border-b border-white/10 pt-safe transition-all duration-300 ' + (showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none')}>
        <div className="flex items-center justify-between h-14 px-4">
          <button onClick={handleBack} className="p-2 -ml-2 text-white/90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="text-sm font-medium text-white truncate mx-4 flex-1 text-center">{fileName.replace('.pdf','')}</h1>
          <button onClick={() => setShowAnnotationModal(true)} className="p-2 -mr-2 text-white/90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
          </button>
        </div>
      </header>

      <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden" onScroll={handleScroll} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onWheel={handleWheel} onClick={handleTap} style={{scrollbarWidth:'none',msOverflowStyle:'none'}}>
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        <div className="flex flex-col items-center py-2 px-2">
          {pdfDoc && Array.from({length:totalPages},(_,i)=>i+1).map(num=>(
            <PDFPage
              key={num}
              pageNum={num}
              pdfDoc={pdfDoc}
              baseScale={baseScale}
              scale={scale}
              dimensions={pageDimensions[num - 1]}
              annotationCount={getPageAnnotationCount(num)}
              onCanvasRef={handleCanvasRef}
            />
          ))}
        </div>
      </div>

      <div className={'absolute bottom-0 left-0 right-0 z-30 pb-safe transition-all duration-300 '+(showControls?'opacity-100 translate-y-0':'opacity-0 translate-y-full pointer-events-none')}>
        <div className="flex items-center justify-center py-3 bg-black/70 backdrop-blur-md border-t border-white/10">
          <div className="bg-white/10 rounded-full px-4 py-2"><span className="text-white font-medium">{currentPage}</span><span className="text-white/50 mx-1">/</span><span className="text-white/70">{totalPages}</span></div>
        </div>
      </div>

      {showZoomIndicator && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"><div className="bg-black/80 backdrop-blur-sm rounded-2xl px-6 py-3"><span className="text-white text-lg font-semibold">{Math.round(scale*100)}%</span></div></div>}

      <Modal isOpen={showAnnotationModal} onClose={()=>{setShowAnnotationModal(false);setAnnotationNote('');}} title="Add Note">
        <div className="space-y-4">
          <div className="py-2 border-l-2 border-accent/40 pl-3"><p className="text-xs text-ink-light/50 dark:text-ink-dark/50 mb-0.5">Page</p><p className="text-sm text-ink-light dark:text-ink-dark">{currentPage} of {totalPages}</p></div>
          <textarea value={annotationNote} onChange={e=>setAnnotationNote(e.target.value)} placeholder="Write your thoughts..." className="w-full px-3 py-2 text-sm bg-paper-light dark:bg-paper-dark border border-ink-light/10 dark:border-ink-dark/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none text-ink-light dark:text-ink-dark" rows={4} autoFocus/>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={()=>{setShowAnnotationModal(false);setAnnotationNote('');}} className="flex-1">Cancel</Button>
            <Button onClick={handleSaveAnnotation} loading={savingAnnotation} disabled={!annotationNote.trim()} className="flex-1">Save Note</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
