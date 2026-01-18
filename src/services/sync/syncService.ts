import type { Source, FileEntry, SyncProgress, SyncResult, SearchIndexEntry } from '@/data/types';
import { fileRepository, searchIndexRepository, sourceRepository } from '@/data/repositories';
import { githubApi } from '@/services/github';
import { extractSearchContent } from '@/utils/markdown';

type ProgressCallback = (progress: SyncProgress) => void;

export const syncService = {
  async syncSource(source: Source, onProgress?: ProgressCallback): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      added: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    try {
      // Phase 1: Fetch tree from GitHub
      onProgress?.({
        phase: 'fetching',
        current: 0,
        total: 0,
        message: 'Fetching repository structure...',
      });

      const remoteTree = await githubApi.fetchTree({
        owner: source.owner,
        repo: source.repo,
        branch: source.branch,
        token: source.authToken,
      });

      // Phase 2: Compare with local files
      onProgress?.({
        phase: 'comparing',
        current: 0,
        total: remoteTree.length,
        message: 'Comparing files...',
      });

      const localFiles = await fileRepository.getBySource(source.id);
      const localFileMap = new Map(localFiles.map((f) => [f.path, f]));

      const remotePaths = new Set<string>();
      const filesToDownload: { path: string; sha: string; size: number; isFolder: boolean }[] = [];
      const foldersToCreate: FileEntry[] = [];

      for (const item of remoteTree) {
        remotePaths.add(item.path);

        if (item.type === 'tree') {
          // It's a folder
          const localFolder = localFileMap.get(item.path);
          if (!localFolder) {
            const pathParts = item.path.split('/');
            const name = pathParts[pathParts.length - 1];
            const parentPath = pathParts.slice(0, -1).join('/') || '';

            foldersToCreate.push({
              id: `${source.id}:${item.path}`,
              sourceId: source.id,
              path: item.path,
              name,
              type: 'folder',
              sha: item.sha,
              size: 0,
              parentPath,
            });
          }
        } else {
          // It's a file
          const localFile = localFileMap.get(item.path);
          if (!localFile || localFile.sha !== item.sha) {
            filesToDownload.push({
              path: item.path,
              sha: item.sha,
              size: item.size || 0,
              isFolder: false,
            });
          }
        }
      }

      // Find deleted files
      const filesToDelete: string[] = [];
      for (const localFile of localFiles) {
        if (!remotePaths.has(localFile.path)) {
          filesToDelete.push(localFile.path);
        }
      }

      // Phase 3: Create folders
      if (foldersToCreate.length > 0) {
        await fileRepository.upsertMany(foldersToCreate);
      }

      // Phase 4: Download new/updated files
      const totalFiles = filesToDownload.length;
      const searchEntries: Omit<SearchIndexEntry, 'id'>[] = [];

      for (let i = 0; i < filesToDownload.length; i++) {
        const file = filesToDownload[i];

        onProgress?.({
          phase: 'downloading',
          current: i + 1,
          total: totalFiles,
          message: `Downloading ${file.path}...`,
        });

        try {
          const { content, isText } = await githubApi.fetchFileContent(
            {
              owner: source.owner,
              repo: source.repo,
              branch: source.branch,
              token: source.authToken,
            },
            file.path
          );

          // Save file metadata
          const pathParts = file.path.split('/');
          const name = pathParts[pathParts.length - 1];
          const parentPath = pathParts.slice(0, -1).join('/') || '';

          const mimeType = getMimeType(file.path);

          await fileRepository.upsert({
            sourceId: source.id,
            path: file.path,
            name,
            type: 'file',
            sha: file.sha,
            size: file.size,
            mimeType,
            parentPath,
          });

          // Check if it's a markdown file for search indexing
          const isMarkdownFile = file.path.toLowerCase().endsWith('.md');

          // Save file content
          if (isText) {
            await fileRepository.saveContent({
              sourceId: source.id,
              path: file.path,
              content: content as string,
              isMarkdown: isMarkdownFile,
            });

            // Build search index entry for markdown files only
            if (isMarkdownFile) {
              const extracted = extractSearchContent(content as string);
              searchEntries.push({
                sourceId: source.id,
                filePath: file.path,
                title: extracted.title || name.replace('.md', ''),
                content: extracted.content,
                headings: extracted.headings,
              });
            }
          } else {
            // Convert ArrayBuffer to Blob for binary files (images, PDFs)
            const blob = new Blob([content as ArrayBuffer], { type: mimeType });
            await fileRepository.saveContent({
              sourceId: source.id,
              path: file.path,
              content: blob,
              isMarkdown: false,
            });
          }

          const localFile = localFileMap.get(file.path);
          if (localFile) {
            result.updated++;
          } else {
            result.added++;
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          result.errors.push(`Failed to download ${file.path}: ${message}`);
        }
      }

      // Phase 5: Delete removed files
      for (const path of filesToDelete) {
        await fileRepository.delete(source.id, path);
        await fileRepository.deleteContent(source.id, path);
        await searchIndexRepository.delete(source.id, path);
        result.deleted++;
      }

      // Phase 6: Update search index
      onProgress?.({
        phase: 'indexing',
        current: 0,
        total: searchEntries.length,
        message: 'Building search index...',
      });

      if (searchEntries.length > 0) {
        await searchIndexRepository.upsertMany(searchEntries);
      }

      // Update last synced time
      await sourceRepository.updateLastSynced(source.id);

      result.success = true;

      onProgress?.({
        phase: 'complete',
        current: totalFiles,
        total: totalFiles,
        message: 'Sync complete!',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push(message);

      onProgress?.({
        phase: 'error',
        current: 0,
        total: 0,
        message: `Sync failed: ${message}`,
      });
    }

    return result;
  },

  async deleteSourceData(sourceId: string, deleteCache: boolean): Promise<void> {
    // Always delete source metadata
    await sourceRepository.delete(sourceId);

    if (deleteCache) {
      // Delete all cached content
      await fileRepository.deleteBySource(sourceId);
      await fileRepository.deleteContentBySource(sourceId);
      await searchIndexRepository.deleteBySource(sourceId);
    }
  },
};

function getMimeType(path: string): string {
  const ext = path.toLowerCase().split('.').pop();
  switch (ext) {
    // Documents
    case 'md':
      return 'text/markdown';
    case 'txt':
      return 'text/plain';
    case 'pdf':
      return 'application/pdf';
    // Images
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'bmp':
      return 'image/bmp';
    case 'ico':
      return 'image/x-icon';
    // Data formats
    case 'json':
      return 'application/json';
    case 'yaml':
    case 'yml':
      return 'text/yaml';
    case 'xml':
      return 'application/xml';
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'csv':
      return 'text/csv';
    case 'excalidraw':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}
