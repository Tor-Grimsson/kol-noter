/**
 * Search Index
 *
 * Full-text search using MiniSearch.
 * Indexes notes, systems, and projects for fast searching.
 */

import MiniSearch, { type SearchResult } from 'minisearch';
import type { Note, System, Project, Block } from '@/store/notesStore';
import { isTauri, readFile, writeFile, pathExists, joinPath } from '@/lib/tauri-bridge';
import { FILE_PATTERNS } from '@/lib/persistence/types';

/**
 * Searchable document structure
 */
export interface SearchDocument {
  id: string;
  type: 'note' | 'system' | 'project';
  title: string;
  content: string;
  tags: string[];
  systemId?: string;
  projectId?: string;
  path?: string;
  updatedAt: number;
}

/**
 * Search result with highlighted matches
 */
export interface SearchHit {
  id: string;
  type: 'note' | 'system' | 'project';
  title: string;
  preview: string;
  tags: string[];
  score: number;
  matches: Record<string, string[]>;
  systemId?: string;
  projectId?: string;
}

/**
 * Search options
 */
export interface SearchOptions {
  /** Filter by type */
  type?: 'note' | 'system' | 'project' | 'all';
  /** Filter by system ID */
  systemId?: string;
  /** Filter by project ID */
  projectId?: string;
  /** Maximum results to return */
  limit?: number;
  /** Fuzzy matching threshold (0-1, lower = more fuzzy) */
  fuzzy?: number;
  /** Boost certain fields */
  boost?: {
    title?: number;
    content?: number;
    tags?: number;
  };
}

/**
 * Default search options
 */
const DEFAULT_OPTIONS: SearchOptions = {
  type: 'all',
  limit: 50,
  fuzzy: 0.2,
  boost: {
    title: 2,
    content: 1,
    tags: 1.5,
  },
};

/**
 * Extract plain text content from a note
 */
function extractNoteContent(note: Note): string {
  if (typeof note.content === 'string') {
    // Standard editor - markdown content
    return note.content;
  }

  if (Array.isArray(note.content)) {
    const first = note.content[0] as any;

    // Block editor
    if (first?.type && ['heading', 'paragraph', 'code', 'list', 'image', 'section'].includes(first.type)) {
      return (note.content as Block[])
        .map(block => block.content || '')
        .join('\n');
    }

    // Visual editor
    if (first?.type && ['start', 'process', 'decision', 'end'].includes(first.type)) {
      return (note.content as any[])
        .map(node => node.label || '')
        .join('\n');
    }
  }

  return '';
}

/**
 * Create a search document from a note
 */
function noteToDocument(note: Note): SearchDocument {
  return {
    id: note.id,
    type: 'note',
    title: note.title,
    content: extractNoteContent(note),
    tags: note.tags || [],
    systemId: note.systemId,
    projectId: note.projectId,
    updatedAt: note.updatedAt,
  };
}

/**
 * Create a search document from a system
 */
function systemToDocument(system: System): SearchDocument {
  return {
    id: system.id,
    type: 'system',
    title: system.name,
    content: [
      system.description || '',
      system.detailNotes || '',
    ].join('\n'),
    tags: system.tags || [],
    updatedAt: system.updatedAt || Date.now(),
  };
}

/**
 * Create a search document from a project
 */
function projectToDocument(project: Project, systemId: string): SearchDocument {
  return {
    id: project.id,
    type: 'project',
    title: project.name,
    content: [
      project.description || '',
      project.detailNotes || '',
    ].join('\n'),
    tags: project.tags || [],
    systemId,
    updatedAt: project.updatedAt || Date.now(),
  };
}

/**
 * SearchIndex class
 */
export class SearchIndex {
  private index: MiniSearch<SearchDocument>;
  private documents: Map<string, SearchDocument> = new Map();
  private vaultPath: string = '';
  private isDirty: boolean = false;

  constructor() {
    this.index = new MiniSearch<SearchDocument>({
      fields: ['title', 'content', 'tags'],
      storeFields: ['type', 'title', 'tags', 'systemId', 'projectId', 'updatedAt'],
      searchOptions: {
        boost: { title: 2, tags: 1.5 },
        fuzzy: 0.2,
        prefix: true,
      },
      tokenize: (text) => text.toLowerCase().split(/[\s\-_]+/),
    });
  }

  /**
   * Set the vault path for caching
   */
  setVaultPath(path: string): void {
    this.vaultPath = path;
  }

  /**
   * Build index from all data
   */
  async buildIndex(
    notes: Note[],
    systems: System[]
  ): Promise<void> {
    // Clear existing index
    this.index.removeAll();
    this.documents.clear();

    const documents: SearchDocument[] = [];

    // Add notes
    for (const note of notes) {
      const doc = noteToDocument(note);
      documents.push(doc);
      this.documents.set(doc.id, doc);
    }

    // Add systems and their projects
    for (const system of systems) {
      const sysDoc = systemToDocument(system);
      documents.push(sysDoc);
      this.documents.set(sysDoc.id, sysDoc);

      for (const project of system.projects) {
        const projDoc = projectToDocument(project, system.id);
        documents.push(projDoc);
        this.documents.set(projDoc.id, projDoc);
      }
    }

    // Add all documents to index
    this.index.addAll(documents);
    this.isDirty = true;

    console.log(`Search index built: ${documents.length} documents`);
  }

  /**
   * Add or update a note in the index
   */
  updateNote(note: Note): void {
    const doc = noteToDocument(note);

    // Remove existing if present
    if (this.documents.has(doc.id)) {
      this.index.remove(this.documents.get(doc.id)!);
    }

    // Add updated document
    this.index.add(doc);
    this.documents.set(doc.id, doc);
    this.isDirty = true;
  }

  /**
   * Add or update a system in the index
   */
  updateSystem(system: System): void {
    const doc = systemToDocument(system);

    if (this.documents.has(doc.id)) {
      this.index.remove(this.documents.get(doc.id)!);
    }

    this.index.add(doc);
    this.documents.set(doc.id, doc);
    this.isDirty = true;
  }

  /**
   * Add or update a project in the index
   */
  updateProject(project: Project, systemId: string): void {
    const doc = projectToDocument(project, systemId);

    if (this.documents.has(doc.id)) {
      this.index.remove(this.documents.get(doc.id)!);
    }

    this.index.add(doc);
    this.documents.set(doc.id, doc);
    this.isDirty = true;
  }

  /**
   * Remove a document from the index
   */
  remove(id: string): void {
    const doc = this.documents.get(id);
    if (doc) {
      this.index.remove(doc);
      this.documents.delete(id);
      this.isDirty = true;
    }
  }

  /**
   * Search the index
   */
  search(query: string, options: SearchOptions = {}): SearchHit[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    if (!query.trim()) {
      return [];
    }

    // Build search options
    const searchOpts: any = {
      fuzzy: opts.fuzzy,
      prefix: true,
      boost: opts.boost,
    };

    // Type filter
    if (opts.type && opts.type !== 'all') {
      searchOpts.filter = (result: SearchResult) => {
        const doc = this.documents.get(result.id);
        return doc?.type === opts.type;
      };
    }

    // Execute search
    let results = this.index.search(query, searchOpts);

    // Apply additional filters
    if (opts.systemId) {
      results = results.filter(r => {
        const doc = this.documents.get(r.id);
        return doc?.systemId === opts.systemId;
      });
    }

    if (opts.projectId) {
      results = results.filter(r => {
        const doc = this.documents.get(r.id);
        return doc?.projectId === opts.projectId;
      });
    }

    // Limit results
    if (opts.limit) {
      results = results.slice(0, opts.limit);
    }

    // Transform to SearchHit
    return results.map(result => {
      const doc = this.documents.get(result.id)!;
      return {
        id: result.id,
        type: doc.type,
        title: doc.title,
        preview: doc.content.slice(0, 150),
        tags: doc.tags,
        score: result.score,
        matches: result.match,
        systemId: doc.systemId,
        projectId: doc.projectId,
      };
    });
  }

  /**
   * Get suggestions for autocomplete
   */
  suggest(query: string, limit = 5): string[] {
    if (!query.trim()) {
      return [];
    }

    const results = this.index.autoSuggest(query, {
      fuzzy: 0.2,
      prefix: true,
    });

    return results.slice(0, limit).map(r => r.suggestion);
  }

  /**
   * Save index to cache file
   */
  async saveCache(): Promise<void> {
    if (!this.vaultPath || !isTauri() || !this.isDirty) {
      return;
    }

    try {
      const cachePath = joinPath(
        this.vaultPath,
        FILE_PATTERNS.CONFIG_DIR,
        FILE_PATTERNS.SEARCH_INDEX_FILE
      );

      const cacheData = {
        version: 1,
        timestamp: Date.now(),
        index: this.index.toJSON(),
        documents: Array.from(this.documents.entries()),
      };

      await writeFile(cachePath, JSON.stringify(cacheData));
      this.isDirty = false;

      console.log('Search index cached');
    } catch (error) {
      console.error('Failed to cache search index:', error);
    }
  }

  /**
   * Load index from cache file
   * Returns true if cache was loaded successfully
   */
  async loadCache(): Promise<boolean> {
    if (!this.vaultPath || !isTauri()) {
      return false;
    }

    try {
      const cachePath = joinPath(
        this.vaultPath,
        FILE_PATTERNS.CONFIG_DIR,
        FILE_PATTERNS.SEARCH_INDEX_FILE
      );

      if (!(await pathExists(cachePath))) {
        return false;
      }

      const content = await readFile(cachePath);
      const cacheData = JSON.parse(content);

      // Validate cache version
      if (cacheData.version !== 1) {
        console.log('Search index cache version mismatch, rebuilding');
        return false;
      }

      // Restore index
      this.index = MiniSearch.loadJSON(JSON.stringify(cacheData.index), {
        fields: ['title', 'content', 'tags'],
        storeFields: ['type', 'title', 'tags', 'systemId', 'projectId', 'updatedAt'],
      });

      // Restore documents map
      this.documents = new Map(cacheData.documents);
      this.isDirty = false;

      console.log(`Search index loaded from cache: ${this.documents.size} documents`);
      return true;
    } catch (error) {
      console.error('Failed to load search index cache:', error);
      return false;
    }
  }

  /**
   * Get index statistics
   */
  getStats(): { documentCount: number; termCount: number } {
    return {
      documentCount: this.documents.size,
      termCount: this.index.termCount,
    };
  }

  /**
   * Clear the index
   */
  clear(): void {
    this.index.removeAll();
    this.documents.clear();
    this.isDirty = true;
  }
}

/**
 * Singleton search index instance
 */
export const searchIndex = new SearchIndex();
