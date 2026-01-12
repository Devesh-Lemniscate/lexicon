import MarkdownIt from 'markdown-it';
import type { TocItem } from '@/data/types';

// Create markdown-it instance with options
const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
});

// Add heading IDs for TOC navigation
md.renderer.rules.heading_open = function (tokens, idx, options, _env, self) {
  const token = tokens[idx];
  const nextToken = tokens[idx + 1];
  const text = nextToken?.content || '';
  const id = slugify(text);
  token.attrSet('id', id);
  return self.renderToken(tokens, idx, options);
};

/**
 * Render markdown to HTML
 */
export function renderMarkdown(content: string): string {
  return md.render(content);
}

/**
 * Extract table of contents from markdown
 */
export function extractToc(content: string): TocItem[] {
  const toc: TocItem[] = [];
  const lines = content.split('\n');
  let offset = 0;

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = slugify(text);

      toc.push({
        id,
        level,
        text,
        offset,
      });
    }
    offset += line.length + 1; // +1 for newline
  }

  return toc;
}

/**
 * Extract content for search indexing
 */
export function extractSearchContent(content: string): {
  title: string;
  content: string;
  headings: string[];
} {
  const lines = content.split('\n');
  const headings: string[] = [];
  let title = '';

  // Extract headings
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const text = match[2].trim();
      headings.push(text);
      if (!title && match[1].length === 1) {
        title = text;
      }
    }
  }

  // If no h1 found, use first heading or filename will be used
  if (!title && headings.length > 0) {
    title = headings[0];
  }

  // Strip markdown syntax for plain text search
  const plainContent = stripMarkdown(content);

  return {
    title,
    content: plainContent,
    headings,
  };
}

/**
 * Strip markdown syntax to get plain text
 */
export function stripMarkdown(content: string): string {
  return (
    content
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '')
      // Remove headers markers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove emphasis
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      // Remove blockquotes
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')
      // Remove list markers
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Collapse whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Create URL-safe slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Find heading by ID in content
 */
export function findHeadingPosition(content: string, headingId: string): number {
  const toc = extractToc(content);
  const heading = toc.find((item) => item.id === headingId);
  return heading?.offset || 0;
}

/**
 * Get heading at a specific scroll position
 */
export function getHeadingAtPosition(content: string, offset: number): TocItem | undefined {
  const toc = extractToc(content);
  let currentHeading: TocItem | undefined;

  for (const heading of toc) {
    if (heading.offset <= offset) {
      currentHeading = heading;
    } else {
      break;
    }
  }

  return currentHeading;
}
