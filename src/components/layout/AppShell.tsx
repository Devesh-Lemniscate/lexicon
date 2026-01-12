import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark">
      {/* Main content area - account for bottom nav */}
      <main className="pb-20">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
