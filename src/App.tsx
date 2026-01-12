import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import AppShell from './components/layout/AppShell';
import LoadingSpinner from './components/common/LoadingSpinner';
import AuthGate from './components/auth/AuthGate';
import { notificationService } from './services/notifications/notificationService';

// Lazy load screens for better performance
const LibraryScreen = lazy(() => import('./components/library/LibraryScreen'));
const FolderView = lazy(() => import('./components/library/FolderView'));
const SearchScreen = lazy(() => import('./components/search/SearchScreen'));
const BookmarksScreen = lazy(() => import('./components/bookmarks/BookmarksScreen'));
const SettingsScreen = lazy(() => import('./components/settings/SettingsScreen'));
const ReaderScreen = lazy(() => import('./components/reader/ReaderScreen'));
const TodosScreen = lazy(() => import('./components/todos/TodosScreen'));
const IdeasScreen = lazy(() => import('./components/ideas/IdeasScreen'));
const NotesScreen = lazy(() => import('./components/notes/NotesScreen'));
const ExcalidrawViewer = lazy(() => import('./components/reader/ExcalidrawViewer'));
const ImageViewerScreen = lazy(() => import('./components/reader/ImageViewerScreen'));

function App() {
  // Initialize notification service for todo reminders
  useEffect(() => {
    notificationService.start();
    return () => notificationService.stop();
  }, []);

  return (
    <AuthGate>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
          {/* Reader routes - fullscreen, no shell */}
          <Route path="/read/:sourceId/*" element={<ReaderScreen />} />
          <Route path="/excalidraw/:sourceId/*" element={<ExcalidrawViewer />} />
          <Route path="/image/:sourceId/*" element={<ImageViewerScreen />} />
          
          {/* Main app routes with bottom nav */}
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/library" replace />} />
            <Route path="/library" element={<LibraryScreen />} />
            <Route path="/library/:sourceId/*" element={<FolderView />} />
            <Route path="/search" element={<SearchScreen />} />
            <Route path="/bookmarks" element={<BookmarksScreen />} />
            <Route path="/todos" element={<TodosScreen />} />
            <Route path="/ideas" element={<IdeasScreen />} />
            <Route path="/notes" element={<NotesScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthGate>
  );
}

export default App;
