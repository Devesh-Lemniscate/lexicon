import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import SemicircleDrawer, { DRAWER_ITEMS, type DrawerItem } from './SemicircleDrawer';

// Default left slot item
const DEFAULT_LEFT_ITEM = DRAWER_ITEMS.find(item => item.id === 'ideas')!;

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [leftSlotItem, setLeftSlotItem] = useState<DrawerItem>(DEFAULT_LEFT_ITEM);

  // Update left slot when navigating to a drawer path
  useEffect(() => {
    const currentDrawerItem = DRAWER_ITEMS.find(item => 
      location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    );
    
    if (currentDrawerItem && currentDrawerItem.id !== 'todos') {
      setLeftSlotItem(currentDrawerItem);
    }
  }, [location.pathname]);

  const handleDrawerSelect = (item: DrawerItem) => {
    setLeftSlotItem(item);
    navigate(item.path);
  };

  const handleCenterClick = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  // Check if we're on the left slot's path
  const isOnLeftPath = location.pathname === leftSlotItem.path || 
    location.pathname.startsWith(leftSlotItem.path + '/');
  
  // Check if we're on todos path
  const isOnTodosPath = location.pathname === '/todos' || 
    location.pathname.startsWith('/todos/');

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-paper-light dark:bg-paper-dark safe-bottom z-40 border-t border-ink-light/10 dark:border-ink-dark/10">
        <div className="flex items-center justify-around h-14 max-w-sm mx-auto pb-1">
          
          {/* Left slot - Dynamic (default: Ideas) */}
          <NavLink
            to={leftSlotItem.path}
            className={`flex items-center justify-center w-12 h-12 transition-colors ${
              isOnLeftPath
                ? 'text-accent'
                : 'text-muted-light dark:text-muted-dark'
            }`}
          >
            {leftSlotItem.icon}
          </NavLink>

          {/* Center - App Drawer Button */}
          <button
            onClick={handleCenterClick}
            className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-200 ${
              isDrawerOpen
                ? 'bg-accent text-white border-accent rotate-45'
                : 'bg-transparent border-ink-light/30 dark:border-ink-dark/30 text-muted-light dark:text-muted-dark'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Right slot - Always Todos */}
          <NavLink
            to="/todos"
            className={`flex items-center justify-center w-12 h-12 transition-colors ${
              isOnTodosPath
                ? 'text-accent'
                : 'text-muted-light dark:text-muted-dark'
            }`}
          >
            <svg className="w-5 h-5" fill={isOnTodosPath ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </NavLink>
        </div>
      </nav>

      {/* Semicircle App Drawer */}
      <SemicircleDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelect={handleDrawerSelect}
        selectedId={leftSlotItem.id}
      />
    </>
  );
}
