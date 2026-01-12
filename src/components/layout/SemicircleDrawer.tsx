import { useRef, useState, useEffect, useCallback } from 'react';

export interface DrawerItem {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
}

export const DRAWER_ITEMS: DrawerItem[] = [
  {
    id: 'ideas',
    path: '/ideas',
    label: 'Ideas',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
  {
    id: 'library',
    path: '/library',
    label: 'Library',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'search',
    path: '/search',
    label: 'Search',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 'bookmarks',
    path: '/bookmarks',
    label: 'Bookmarks',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
  },
  {
    id: 'notes',
    path: '/notes',
    label: 'Notes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// Simplified horizontal carousel-style drawer
const ITEM_WIDTH = 70;
const VISIBLE_ITEMS = 5;

interface SemicircleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: DrawerItem) => void;
  selectedId: string;
}

export default function SemicircleDrawer({ isOpen, onClose, onSelect, selectedId }: SemicircleDrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollX, setScrollX] = useState(0);
  const dragStart = useRef(0);
  const scrollStart = useRef(0);
  const isDragging = useRef(false);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const animationFrame = useRef<number>();

  const totalItems = DRAWER_ITEMS.length;
  const maxScroll = (totalItems - 1) * ITEM_WIDTH;
  const centerOffset = (VISIBLE_ITEMS - 1) / 2 * ITEM_WIDTH;

  const getItemStyle = useCallback((index: number) => {
    const itemX = index * ITEM_WIDTH - scrollX;
    const centerX = centerOffset;
    const distanceFromCenter = Math.abs(itemX - centerX);
    const maxDistance = centerOffset + ITEM_WIDTH;
    
    // Scale and opacity based on distance from center
    const normalizedDistance = Math.min(1, distanceFromCenter / maxDistance);
    const scale = 1 - normalizedDistance * 0.3;
    const opacity = 1 - normalizedDistance * 0.6;
    
    return {
      transform: `translateX(${itemX}px) scale(${scale})`,
      opacity: Math.max(0.2, opacity),
    };
  }, [scrollX, centerOffset]);

  const handleStart = (clientX: number) => {
    isDragging.current = true;
    dragStart.current = clientX;
    scrollStart.current = scrollX;
    lastX.current = clientX;
    lastTime.current = Date.now();
    velocity.current = 0;
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging.current) return;
    
    const delta = dragStart.current - clientX;
    const now = Date.now();
    const dt = now - lastTime.current;
    
    if (dt > 0) {
      velocity.current = (lastX.current - clientX) / dt * 15;
    }
    
    lastX.current = clientX;
    lastTime.current = now;
    
    let newScroll = scrollStart.current + delta;
    newScroll = Math.max(0, Math.min(maxScroll, newScroll));
    setScrollX(newScroll);
  };

  const snapToNearest = useCallback((targetScroll: number) => {
    const nearestIndex = Math.round(targetScroll / ITEM_WIDTH);
    const clampedIndex = Math.max(0, Math.min(totalItems - 1, nearestIndex));
    const targetX = clampedIndex * ITEM_WIDTH;
    
    const startX = scrollX;
    const distance = targetX - startX;
    const duration = 200;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setScrollX(startX + distance * eased);
      
      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };
    
    animationFrame.current = requestAnimationFrame(animate);
  }, [scrollX, totalItems, maxScroll]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    let targetScroll = scrollX + velocity.current * 5;
    targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));
    snapToNearest(targetScroll);
  }, [scrollX, maxScroll, snapToNearest]);

  const handleItemClick = (item: DrawerItem, index: number) => {
    const currentCenterIndex = Math.round(scrollX / ITEM_WIDTH);
    
    if (index === currentCenterIndex) {
      onSelect(item);
      onClose();
    } else {
      // Scroll to this item
      const targetX = index * ITEM_WIDTH;
      snapToNearest(targetX);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setScrollX(0);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      
      {/* Drawer container */}
      <div className="fixed bottom-14 left-0 right-0 z-50">
        {/* Background pill */}
        <div className="mx-auto w-[320px] h-24 bg-paper-light dark:bg-paper-dark rounded-2xl shadow-xl border border-ink-light/10 dark:border-ink-dark/20" />
        
        {/* Items container */}
        <div 
          ref={containerRef}
          className="absolute inset-0 flex items-center justify-center overflow-hidden touch-none select-none"
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
          onTouchEnd={handleEnd}
          onMouseDown={(e) => handleStart(e.clientX)}
          onMouseMove={(e) => handleMove(e.clientX)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
        >
          <div className="relative h-full flex items-center" style={{ width: VISIBLE_ITEMS * ITEM_WIDTH }}>
            {DRAWER_ITEMS.map((item, index) => {
              const style = getItemStyle(index);
              const isSelected = item.id === selectedId;
              const isCentered = Math.abs(index * ITEM_WIDTH - scrollX) < ITEM_WIDTH / 2;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item, index)}
                  className={`absolute left-0 flex flex-col items-center justify-center transition-colors ${
                    isSelected ? 'text-accent' : 'text-ink-light dark:text-ink-dark'
                  }`}
                  style={{
                    width: ITEM_WIDTH,
                    ...style,
                    pointerEvents: style.opacity > 0.3 ? 'auto' : 'none',
                  }}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-accent text-white' 
                      : isCentered
                      ? 'bg-ink-light/10 dark:bg-ink-dark/20'
                      : 'bg-transparent'
                  }`}>
                    {item.icon}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                    isCentered ? 'opacity-100' : 'opacity-50'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
