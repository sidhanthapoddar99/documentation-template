/**
 * Editor Store - In-memory document management for live editing
 *
 * Manages open documents during editing sessions:
 * - Reads files from disk on open
 * - Parses frontmatter and renders markdown through the full pipeline
 * - Tracks dirty state for auto-save
 * - Writes back to disk on save
 *
 * Dev-only: never loaded in production builds.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { DocsParser } from '../../parsers/content-types/docs';
import { BlogParser } from '../../parsers/content-types/blog';
import type { ProcessContext, ContentType } from '../../parsers/types';
import { createMarkdownRenderer } from '../../parsers/renderers/marked';

export interface EditorDocument {
  /** Absolute path to the file on disk */
  filePath: string;
  /** Raw file content (frontmatter + body) */
  raw: string;
  /** Parsed frontmatter object */
  frontmatter: Record<string, unknown>;
  /** Raw markdown body (without frontmatter) */
  body: string;
  /** Rendered HTML preview */
  rendered: string;
  /** Whether the in-memory content differs from disk */
  dirty: boolean;
  /** Content type (docs or blog) */
  contentType: ContentType;
  /** Base path of the content directory */
  basePath: string;
}

export interface EditorConfig {
  /** Auto-save interval in milliseconds (default: 10000) */
  autosaveInterval: number;
  /** Watch paths for security validation */
  watchPaths: string[];
}

export class EditorStore {
  private documents = new Map<string, EditorDocument>();
  private docsParser: DocsParser;
  private blogParser: BlogParser;
  private render: (content: string) => string;
  private autosaveTimer: ReturnType<typeof setInterval> | null = null;
  private config: EditorConfig;

  constructor(config: EditorConfig) {
    this.config = config;
    this.docsParser = new DocsParser();
    this.blogParser = new BlogParser();
    this.render = createMarkdownRenderer();
  }

  /**
   * Check if a file path is within allowed watch paths
   */
  private isAllowedPath(filePath: string): boolean {
    const resolved = path.resolve(filePath);
    return this.config.watchPaths.some(wp => resolved.startsWith(wp));
  }

  /**
   * Detect content type from file path
   */
  private detectContentType(filePath: string): ContentType {
    const normalized = filePath.replace(/\\/g, '/');
    if (normalized.includes('/blog/')) return 'blog';
    return 'docs';
  }

  /**
   * Find the base path (content root) for a file
   */
  private findBasePath(filePath: string): string {
    // Walk up to find the docs/ or blog/ directory
    const normalized = filePath.replace(/\\/g, '/');
    const segments = normalized.split('/');

    for (let i = segments.length - 1; i >= 0; i--) {
      if (segments[i] === 'docs' || segments[i] === 'blog') {
        return segments.slice(0, i + 1).join('/');
      }
    }

    return path.dirname(filePath);
  }

  /**
   * Render markdown body through the full pipeline
   */
  private async renderBody(
    body: string,
    filePath: string,
    contentType: ContentType,
    basePath: string,
    frontmatter: Record<string, unknown>
  ): Promise<string> {
    const parser = contentType === 'blog' ? this.blogParser : this.docsParser;
    const pipeline = parser.getPipeline();

    const context: ProcessContext = {
      filePath,
      fileDir: path.dirname(filePath),
      contentType,
      frontmatter,
      basePath,
      frontmatterLineCount: 0,
    };

    return pipeline.process(body, context, this.render);
  }

  /**
   * Open a document for editing
   */
  async openDocument(filePath: string): Promise<EditorDocument> {
    if (!this.isAllowedPath(filePath)) {
      throw new Error(`File path not allowed: ${filePath}`);
    }

    // If already open, return existing
    const existing = this.documents.get(filePath);
    if (existing) return existing;

    // Read from disk
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(raw);

    const contentType = this.detectContentType(filePath);
    const basePath = this.findBasePath(filePath);

    // Render through pipeline
    const rendered = await this.renderBody(body, filePath, contentType, basePath, frontmatter);

    const doc: EditorDocument = {
      filePath,
      raw,
      frontmatter,
      body,
      rendered,
      dirty: false,
      contentType,
      basePath,
    };

    this.documents.set(filePath, doc);
    console.log(`[editor] Opened: ${path.basename(filePath)}`);
    return doc;
  }

  /**
   * Update document content (from keystroke)
   */
  async updateDocument(filePath: string, rawContent: string): Promise<EditorDocument> {
    const doc = this.documents.get(filePath);
    if (!doc) {
      throw new Error(`Document not open: ${filePath}`);
    }

    // Re-parse frontmatter and body
    const { data: frontmatter, content: body } = matter(rawContent);

    // Re-render through pipeline
    const rendered = await this.renderBody(body, filePath, doc.contentType, doc.basePath, frontmatter);

    // Update in-memory document
    doc.raw = rawContent;
    doc.frontmatter = frontmatter;
    doc.body = body;
    doc.rendered = rendered;
    doc.dirty = true;

    return doc;
  }

  /**
   * Save document to disk
   */
  saveDocument(filePath: string): { success: boolean; savedAt: string } {
    const doc = this.documents.get(filePath);
    if (!doc) {
      throw new Error(`Document not open: ${filePath}`);
    }

    if (doc.dirty) {
      fs.writeFileSync(filePath, doc.raw, 'utf-8');
      doc.dirty = false;
      console.log(`[editor] Saved: ${path.basename(filePath)}`);
    }

    return { success: true, savedAt: new Date().toISOString() };
  }

  /**
   * Close document (save if dirty, remove from map)
   */
  closeDocument(filePath: string): void {
    const doc = this.documents.get(filePath);
    if (!doc) return;

    if (doc.dirty) {
      fs.writeFileSync(filePath, doc.raw, 'utf-8');
      console.log(`[editor] Auto-saved on close: ${path.basename(filePath)}`);
    }

    this.documents.delete(filePath);
    console.log(`[editor] Closed: ${path.basename(filePath)}`);
  }

  /**
   * Check if a file is currently being edited
   */
  isEditing(filePath: string): boolean {
    return this.documents.has(filePath);
  }

  /**
   * Start periodic background save for all dirty documents
   */
  startBackgroundSave(): void {
    if (this.autosaveTimer) return;

    this.autosaveTimer = setInterval(() => {
      for (const [filePath, doc] of this.documents) {
        if (doc.dirty) {
          try {
            fs.writeFileSync(filePath, doc.raw, 'utf-8');
            doc.dirty = false;
            console.log(`[editor] Auto-saved: ${path.basename(filePath)}`);
          } catch (err) {
            console.error(`[editor] Auto-save failed for ${path.basename(filePath)}:`, err);
          }
        }
      }
    }, this.config.autosaveInterval);

    console.log(`[editor] Background save started (interval: ${this.config.autosaveInterval}ms)`);
  }

  /**
   * Stop background save
   */
  stopBackgroundSave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }
}
