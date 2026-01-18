import { useState, useEffect, useRef } from 'react';

interface DrawerItem {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
}

const DRAWER_ITEMS: DrawerItem[] = [
  {
    id: 'library',
    path: '/library',
    label: 'Library',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'ideas',
    path: '/ideas',
    label: 'Ideas',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
  {
    id: 'search',
    path: '/search',
    label: 'Search',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 'bookmarks',
    path: '/bookmarks',
    label: 'Saved',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
  },
];

const CIRCLE_RADIUS = 100; // Fixed radius for the circular layout

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: DrawerItem) => void;
  selectedId: string;
}

export default function AppDrawer({ isOpen, onClose, onSelect, selectedId }: AppDrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollAngle, setScrollAngle] = useState(0);
  const touchStart = useRef({ x: 0, angle: 0 });
  const isDragging = useRef(false);

  // Calculate positions of items on the arc
  const getItemPositions = () => {
    const itemCount = DRAWER_ITEMS.length;
    const angleSpread = Math.min(180, itemCount * 45); // Max 180 degrees spread
    const startAngle = -90 - angleSpread / 2; // Center the arc at top
    const angleStep = angleSpread / (itemCount - 1 || 1);

    return DRAWER_ITEMS.map((item, index) => {
      const angle = startAngle + index * angleStep + scrollAngle;
      const radians = (angle * Math.PI) / 180;
      const x = Math.cos(radians) * CIRCLE_RADIUS;
      const y = Math.sin(radians) * CIRCLE_RADIUS;
      return { ...item, x, y, angle };
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    touchStart.current = {
      x: e.touches[0].clientX,
      angle: scrollAngle,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.touches[0].clientX - touchStart.current.x;
    const angleChange = deltaX * 0.3; // Sensitivity
    
    // Limit scroll range
    const maxScroll = 30;
    const newAngle = Math.max(-maxScroll, Math.min(maxScroll, touchStart.current.angle + angleChange));
    setScrollAngle(newAngle);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  const handleItemClick = (item: DrawerItem) => {
    onSelect(item);
    onClose();
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positions = getItemPositions();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Drawer container */}
      <div
        ref={containerRef}
        className="relative mb-20 w-full flex justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ height: CIRCLE_RADIUS + 80 }}
      >
        {/* Arc items */}
        <div className="relative" style={{ width: CIRCLE_RADIUS * 2 + 60, height: CIRCLE_RADIUS + 60 }}>
          {positions.map((item) => {
            const isSelected = selectedId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`absolute flex flex-col items-center justify-center transition-all duration-200 ${
                  isSelected
                    ? 'text-accent scale-110'
                    : 'text-white/70 hover:text-white'
                }`}
                style={{
                  left: `calc(50% + ${item.x}px - 28px)`,
                  bottom: `${item.y + CIRCLE_RADIUS}px`,
                  width: 56,
                  height: 56,
                }}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isSelected
                    ? 'bg-accent text-white shadow-lg shadow-accent/40'
                    : 'bg-white/10'
                }`}>
                  {item.icon}
                </div>
                <span className={`text-xs mt-1 font-medium whitespace-nowrap transition-colors ${
                  isSelected ? 'text-accent' : ''
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Close hint */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-white/50 text-xs">
          Tap outside to close
        </div>
      </div>
    </div>
  );
}

export { DRAWER_ITEMS };
export type { DrawerItem };
