# Notes Reader

A **calm, distraction-free reading experience** for your markdown notes stored in GitHub repositories.

Notes Reader is a Progressive Web App (PWA) designed to work like a premium e-reader (similar to Kindle or Apple Books) for your personal knowledge base.

---

## ✨ Features

### 📚 Library Management
- Connect multiple GitHub repositories as "Sources"
- Support for both public and private repositories
- On-demand sync (no background polling)
- Clean folder/file navigation

### 📖 Premium Reading Experience
- Fullscreen, distraction-free reader
- Tap to show/hide controls
- Adjustable typography (font family, size, line height)
- Auto-generated Table of Contents
- Resume reading from last position
- Dark/Light/System theme support

### 🔖 Bookmarks & Notes
- Bookmark any reading position
- Add personal notes at headings or paragraphs
- Notes are stored locally and survive content updates
- Quick navigation back to bookmarked positions

### 🔍 Full-Text Search
- Search across all synced content
- Fuzzy search powered by Fuse.js
- Highlighted matches with snippets
- Jump directly to search results

### 📱 PWA Features
- Installable on Android (Add to Home Screen)
- Works fully offline after sync
- Aggressive caching for app shell
- Content cached on-demand

---

## 📋 What is a "Source"?

A **Source** represents a single GitHub repository containing your notes.

Each source has:
- **Name**: Display name (e.g., "Interview Notes")
- **Owner**: GitHub username or organization
- **Repo**: Repository name
- **Branch**: Branch to sync (default: `main`)
- **Visibility**: Public or Private
- **Auth Token**: Required for private repos (read-only)

You can add multiple sources to organize different knowledge domains.

---

## 🔐 Adding Public vs Private Repos

### Public Repositories
1. Go to **Settings → Add Source**
2. Enter the repository owner and name
3. Select "Public" visibility
4. Tap "Add Source"
5. The initial sync will start automatically

### Private Repositories
1. Create a **Fine-Grained Personal Access Token** on GitHub:
   - Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens
   - Create a new token with:
     - Repository access: Select your notes repo
     - Permissions: **Contents → Read-only**
   - Copy the token (starts with `ghp_`)
2. Go to **Settings → Add Source**
3. Enter the repository details
4. Select "Private" visibility
5. Paste your token
6. Tap "Add Source"

> ⚠️ **Security Note**: Tokens are stored locally in IndexedDB. Use read-only tokens with minimal scope.

---

## 🔄 How Sync Works

Sync is **on-demand only** — it happens when you press the sync button.

### Sync Process:
1. Fetch repository tree via GitHub REST API
2. Filter to supported file types only
3. Compare remote file SHA with local SHA
4. Download only new or modified files
5. Cache content locally in IndexedDB
6. Rebuild search index

### What Gets Synced:
- ✅ Markdown files (`.md`)
- ✅ Images (`.png`, `.jpg`, `.jpeg`, `.webp`)

### What Gets Ignored:
- ❌ All other file types
- ❌ `.excalidraw` files
- ❌ Binary files
- ❌ Code files (`.js`, `.py`, etc.)
- ❌ Config files

---

## 📁 Supported File Types

| Type | Extensions | Behavior |
|------|------------|----------|
| Markdown | `.md` | Rendered with syntax highlighting |
| Images | `.png`, `.jpg`, `.jpeg`, `.webp` | Displayed inline, tap to zoom |

All other files are ignored during sync.

---

## 💾 Where Data is Stored

### Local-Only Data (IndexedDB)
All user data stays on your device:

| Data | Location | Syncs to GitHub? |
|------|----------|------------------|
| Bookmarks | IndexedDB | ❌ Never |
| Personal Notes | IndexedDB | ❌ Never |
| Reading Progress | IndexedDB | ❌ Never |
| Theme Settings | IndexedDB | ❌ Never |
| Cached Content | IndexedDB | ❌ Never |

**Your notes and bookmarks are private and never leave your device.**

---

## 📴 Offline Behavior

Notes Reader is designed for offline-first usage:

1. **App Shell**: Cached aggressively, loads instantly offline
2. **Content**: Cached after sync, available offline
3. **Search**: Works fully offline using local index
4. **Reading**: All synced content available offline

### What Requires Internet:
- Adding new sources
- Syncing content
- Initial app load (first time only)

---

## ⚙️ Reader Settings

Access via **Settings** tab:

| Setting | Options |
|---------|---------|
| Theme | Light / Dark / System |
| Font Family | Sans-serif / Serif |
| Font Size | 14px – 24px |
| Line Height | 1.4 – 2.0 |

Settings persist across sessions.

---

## 📂 Opening Local Files

You can open any `.md` file from your device:

1. Go to **Settings**
2. Tap "Open Local Markdown File"
3. Select a `.md` file from your device
4. File opens immediately in the reader

> ⚠️ **Limitation**: Relative image paths in local files may not resolve due to browser security restrictions.

---

## 🚧 Limitations

- **No write-back**: Notes Reader never modifies your GitHub content
- **No real-time sync**: Manual sync only
- **No collaborative features**: Single-user, personal app
- **Image limitations**: Local files with relative images may show broken images
- **Large repos**: Repositories over 1GB may experience slower syncs
- **Truncated trees**: Very large repos may have truncated file listings

---

## 🛠 Tech Stack

- **React 18** with TypeScript (strict mode)
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **IndexedDB** (via `idb`) for local storage
- **Zustand** for state management
- **Fuse.js** for fuzzy search
- **markdown-it** for Markdown rendering
- **vite-plugin-pwa** for PWA support

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd notes-reader

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Installing as PWA

1. Open the app in Chrome (mobile or desktop)
2. Look for "Install" prompt or use browser menu
3. Select "Add to Home Screen" or "Install App"
4. The app will work offline after installation

---

## 📱 Target Platforms

- ✅ Android (Chrome PWA)
- ✅ Chrome-based browsers
- ✅ Progressive enhancement for other browsers
- ⚠️ iOS Safari (limited PWA support)

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🤝 Contributing

This is a personal knowledge reading app. Feel free to fork and customize for your own needs!

---

Built with ❤️ for calm, focused reading.
