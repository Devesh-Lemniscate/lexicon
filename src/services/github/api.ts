import type { GitHubTree, GitHubTreeItem } from '@/data/types';

const GITHUB_API_BASE = 'https://api.github.com';

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.md', '.png', '.jpg', '.jpeg', '.webp'];

function isAllowedFile(path: string): boolean {
  const lowerPath = path.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lowerPath.endsWith(ext));
}

function getAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface GitHubApiOptions {
  owner: string;
  repo: string;
  branch?: string;
  token?: string;
}

export const githubApi = {
  /**
   * Fetch the full repository tree recursively
   */
  async fetchTree(options: GitHubApiOptions): Promise<GitHubTreeItem[]> {
    const { owner, repo, branch = 'main', token } = options;
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

    const response = await fetch(url, {
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please add a valid token.');
      }
      if (response.status === 403) {
        throw new Error('Access forbidden. Check your token permissions.');
      }
      if (response.status === 404) {
        throw new Error('Repository not found. Check owner, repo, and branch.');
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data: GitHubTree = await response.json();

    if (data.truncated) {
      console.warn('Repository tree is truncated. Some files may be missing.');
    }

    // Filter to only allowed file types
    return data.tree.filter((item) => {
      if (item.type === 'tree') return true; // Keep folders for structure
      return isAllowedFile(item.path);
    });
  },

  /**
   * Fetch raw file content
   */
  async fetchFileContent(
    options: GitHubApiOptions,
    path: string
  ): Promise<{ content: string | ArrayBuffer; isText: boolean }> {
    const { owner, repo, branch = 'main', token } = options;
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    const isMarkdown = path.toLowerCase().endsWith('.md');

    if (isMarkdown) {
      const content = await response.text();
      return { content, isText: true };
    } else {
      const content = await response.arrayBuffer();
      return { content, isText: false };
    }
  },

  /**
   * Validate repository access
   */
  async validateRepository(options: GitHubApiOptions): Promise<boolean> {
    const { owner, repo, token } = options;
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;

    const response = await fetch(url, {
      headers: getAuthHeaders(token),
    });

    return response.ok;
  },

  /**
   * Get default branch name
   */
  async getDefaultBranch(options: GitHubApiOptions): Promise<string> {
    const { owner, repo, token } = options;
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;

    const response = await fetch(url, {
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to get repository info: ${response.status}`);
    }

    const data = await response.json();
    return data.default_branch || 'main';
  },
};
