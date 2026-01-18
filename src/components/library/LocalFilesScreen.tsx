import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { localFilesRepository, readingProgressRepository } from '@/data/repositories';
import type { LocalFolder, LocalFile } from '@/data/types';
import { LoadingSpinner, Modal, Input, Button } from '@/components/common';

// Supported file types for display
const SUPPORTED_EXTENSIONS = [
  '.md', '.txt', '.pdf', '.excalidraw',
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp',
  '.json', '.yaml', '.yml', '.xml', '.html', '.css', '.csv',
];

function isFileSupported(name: string): boolean {
  const lower = name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export default function LocalFilesScreen() {
  const { '*': currentPath = '' } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [folders, setFolders] = useState<LocalFolder[]>([]);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<LocalFolder | null>(null);
  
  // Modal states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isAddingFiles, setIsAddingFiles] = useState(false);

  // Load folders and files
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (currentPath) {
        // We're inside a folder
        const folder = await localFilesRepository.getFolder(currentPath);
        setCurrentFolder(folder || null);
        if (folder) {
          const folderFiles = await localFilesRepository.getFilesByFolder(folder.id);
          setFiles(folderFiles);
        }
      } else {
        // Root - show folders
        const allFolders = await localFilesRepository.getAllFolders();
        setFolders(allFolders);
        setCurrentFolder(null);
        setFiles([]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    await localFilesRepository.createFolder(newFolderName.trim());
    setNewFolderName('');
    setShowCreateFolder(false);
    await loadData();
  };

  const handleDeleteFolder = async (id: string) => {
    await localFilesRepository.deleteFolder(id);
    setShowDeleteConfirm(null);
    await loadData();
  };

  const handleDeleteFile = async (id: string) => {
    await localFilesRepository.deleteFile(id);
    setShowDeleteConfirm(null);
    await loadData();
  };

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !currentFolder) return;
    
    setIsAddingFiles(true);
    try {
      await localFilesRepository.addFiles(currentFolder.id, e.target.files);
      await loadData();
    } catch (err) {
      console.error('Failed to add files:', err);
    } finally {
      setIsAddingFiles(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFolderClick = (folder: LocalFolder) => {
    navigate(`/local-files/${folder.id}`);
  };

  const handleFileClick = async (file: LocalFile) => {
    // Set last opened for reading progress - use file.id since that's what we navigate with
    await readingProgressRepository.setLastOpened(`local:${file.folderId}`, file.id);
    
    const ext = file.name.toLowerCase().split('.').pop();
    const isExcalidraw = file.name.toLowerCase().endsWith('.excalidraw');
    
    if (ext === 'pdf') {
      navigate(`/pdf/local:${file.folderId}/${file.id}`);
    } else if (ext === 'md') {
      navigate(`/read/local:${file.folderId}/${file.id}`);
    } else if (isExcalidraw) {
      navigate(`/excalidraw/local:${file.folderId}/${file.id}`);
    } else if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext || '')) {
      navigate(`/image/local:${file.folderId}/${file.id}`);
    } else if (['txt', 'json', 'yaml', 'yml', 'xml', 'html', 'css', 'csv'].includes(ext || '')) {
      navigate(`/text/local:${file.folderId}/${file.id}`);
    }
  };

  const handleBack = () => {
    if (currentPath) {
      navigate('/local-files');
    } else {
      navigate('/library');
    }
  };

  const getFileIcon = (file: LocalFile) => {
    const ext = file.name.toLowerCase().split('.').pop();
    
    if (ext === 'pdf') {
      return (
        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext || '')) {
      return (
        <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      );
    }
    if (['json', 'yaml', 'yml', 'xml'].includes(ext || '')) {
      return (
        <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      );
    }
    if (ext === 'md') {
      return (
        <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zM9.75 12h4.5m-4.5 3h4.5" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-ink-light/30 dark:text-ink-dark/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const title = currentFolder ? currentFolder.name : 'Local Files';

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-sm safe-top">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10 -ml-2"
            aria-label="Go back"
          >
            <svg className="w-5 h-5 text-ink-light/60 dark:text-ink-dark/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-base font-medium text-ink-light dark:text-ink-dark truncate ml-1">
            {title}
          </h1>
        </div>
      </header>

      <div className="px-5 pb-6">
        {/* Show folders at root, files inside folder */}
        {!currentPath ? (
          // Root - show folders
          <>
            {folders.length === 0 ? (
              <div className="pt-8">
                <button
                  onClick={() => setShowCreateFolder(true)}
                  className="w-full py-4 flex items-center justify-center gap-2 text-accent border-2 border-dashed border-accent/30 rounded-xl hover:bg-accent/5 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Create your first folder</span>
                </button>
                <p className="text-muted-light dark:text-muted-dark text-center text-sm mt-4">
                  Create folders to organize your local files
                </p>
              </div>
            ) : (
              <>
                <nav className="pt-2">
                  {folders.map((folder) => (
                    <div key={folder.id} className="flex items-center">
                      <button
                        onClick={() => handleFolderClick(folder)}
                        className="flex-1 flex items-center gap-3 py-3 active:bg-black/5 dark:active:bg-white/5 transition-colors text-left"
                      >
                        <svg className="w-5 h-5 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        <span className="flex-1 truncate text-ink-light dark:text-ink-dark text-sm">
                          {folder.name}
                        </span>
                        <svg className="w-4 h-4 text-ink-light/30 dark:text-ink-dark/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(folder.id)}
                        className="p-2 text-ink-light/40 dark:text-ink-dark/40 hover:text-red-500"
                        aria-label="Delete folder"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </nav>

                {/* Add folder button */}
                <button
                  onClick={() => setShowCreateFolder(true)}
                  className="w-full py-3 flex items-center justify-center gap-2 text-muted-light dark:text-muted-dark border border-dashed border-ink-light/10 dark:border-ink-dark/10 rounded-lg hover:bg-ink-light/5 dark:hover:bg-ink-dark/5 transition-colors mt-4"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm">Create new folder</span>
                </button>
              </>
            )}
          </>
        ) : (
          // Inside a folder - show files
          <>
            {files.length === 0 ? (
              <div className="pt-8">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 flex items-center justify-center gap-2 text-accent border-2 border-dashed border-accent/30 rounded-xl hover:bg-accent/5 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Add files from device</span>
                </button>
                <p className="text-muted-light dark:text-muted-dark text-center text-sm mt-4">
                  Supports: PDF, Markdown, Images, Text files
                </p>
              </div>
            ) : (
              <>
                <nav className="pt-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center">
                      <button
                        onClick={() => handleFileClick(file)}
                        className="flex-1 flex items-center gap-3 py-3 active:bg-black/5 dark:active:bg-white/5 transition-colors text-left"
                        disabled={!isFileSupported(file.name)}
                      >
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <span className="block truncate text-ink-light dark:text-ink-dark text-sm">
                            {file.name}
                          </span>
                          <span className="text-xs text-ink-light/50 dark:text-ink-dark/50">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(file.id)}
                        className="p-2 text-ink-light/40 dark:text-ink-dark/40 hover:text-red-500"
                        aria-label="Delete file"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </nav>

                {/* Add files button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAddingFiles}
                  className="w-full py-3 flex items-center justify-center gap-2 text-muted-light dark:text-muted-dark border border-dashed border-ink-light/10 dark:border-ink-dark/10 rounded-lg hover:bg-ink-light/5 dark:hover:bg-ink-dark/5 transition-colors mt-4 disabled:opacity-50"
                >
                  {isAddingFiles ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm">Add more files</span>
                    </>
                  )}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".md,.txt,.pdf,.png,.jpg,.jpeg,.webp,.gif,.svg,.bmp,.json,.yaml,.yml,.xml,.html,.css,.csv"
        onChange={handleAddFiles}
        className="hidden"
      />

      {/* Create folder modal */}
      <Modal
        isOpen={showCreateFolder}
        onClose={() => {
          setShowCreateFolder(false);
          setNewFolderName('');
        }}
        title="Create Folder"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateFolder(); }} className="space-y-4">
          <Input
            label="Folder Name"
            placeholder="My Notes"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCreateFolder(false);
                setNewFolderName('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!newFolderName.trim()} className="flex-1">
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-ink-light dark:text-ink-dark">
            Are you sure you want to delete this? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (showDeleteConfirm) {
                  if (showDeleteConfirm.startsWith('local-folder')) {
                    handleDeleteFolder(showDeleteConfirm);
                  } else {
                    handleDeleteFile(showDeleteConfirm);
                  }
                }
              }}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
