/**
 * Persistence Adapter Types
 *
 * Defines the interface for persistence operations that can be implemented
 * by different backends (localStorage, file system, etc.)
 */

import type { System, Note, Project, EditorType } from '@/store/NotesContext';

/**
 * Result of a vault load operation
 */
export interface VaultData {
  systems: System[];
  notes: Note[];
  trash: Note[];
}

/**
 * Persistence adapter interface
 *
 * Implementations handle reading/writing notes and systems to different backends
 */
export interface IPersistenceAdapter {
  /** Adapter name for debugging */
  readonly name: string;

  /** Whether this adapter supports the current environment */
  isAvailable(): boolean;

  /**
   * Initialize the adapter (e.g., ensure directories exist)
   * Returns the vault path or null for localStorage
   */
  initialize(): Promise<string | null>;

  /**
   * Load all data from storage
   */
  loadAll(): Promise<VaultData>;

  /**
   * Load all systems (includes projects)
   */
  loadSystems(): Promise<System[]>;

  /**
   * Load all notes
   */
  loadNotes(): Promise<Note[]>;

  /**
   * Load notes for a specific project
   */
  loadNotesByProject(systemId: string, projectId: string): Promise<Note[]>;

  /**
   * Load trash
   */
  loadTrash(): Promise<Note[]>;

  /**
   * Save a system (create or update)
   */
  saveSystem(system: System): Promise<void>;

  /**
   * Delete a system and all its contents
   */
  deleteSystem(systemId: string): Promise<void>;

  /**
   * Save a project (create or update)
   */
  saveProject(systemId: string, project: Project): Promise<void>;

  /**
   * Delete a project and all its notes
   */
  deleteProject(systemId: string, projectId: string): Promise<void>;

  /**
   * Save a note (create or update)
   */
  saveNote(note: Note): Promise<void>;

  /**
   * Delete a note (moves to trash in filesystem mode)
   */
  deleteNote(noteId: string): Promise<void>;

  /**
   * Permanently delete a note from trash
   */
  permanentlyDeleteNote(noteId: string): Promise<void>;

  /**
   * Restore a note from trash
   */
  restoreNote(noteId: string): Promise<void>;

  /**
   * Empty the entire trash
   */
  emptyTrash(): Promise<void>;

  /**
   * Save an attachment for a note
   * Returns the path/key where the attachment was stored
   */
  saveAttachment(noteId: string, filename: string, data: string | Blob): Promise<string>;

  /**
   * Delete an attachment
   */
  deleteAttachment(noteId: string, filename: string): Promise<void>;

  /**
   * Get the URL/data for an attachment
   */
  getAttachment(noteId: string, filename: string): Promise<string>;

  /**
   * Calculate the total size of a note (note file + assets folder)
   * Returns the size in bytes
   */
  getNoteSize(noteId: string): Promise<number>;

  /**
   * Subscribe to external changes (for file system adapter)
   * Returns unsubscribe function
   */
  onExternalChange?(callback: (event: ExternalChangeEvent) => void): () => void;
}

/**
 * Types of external change events
 */
export type ExternalChangeType =
  | 'note-created'
  | 'note-updated'
  | 'note-deleted'
  | 'system-created'
  | 'system-updated'
  | 'system-deleted'
  | 'project-created'
  | 'project-updated'
  | 'project-deleted';

/**
 * External change event (from file watcher)
 */
export interface ExternalChangeEvent {
  type: ExternalChangeType;
  path: string;
  itemId?: string;
  itemType: 'note' | 'system' | 'project';
  timestamp: number;
}

/**
 * Persistence configuration
 */
export interface PersistenceConfig {
  /** Which adapter to use */
  adapter: 'localStorage' | 'filesystem';

  /** Vault path (for filesystem adapter) */
  vaultPath?: string;

  /** Enable file watching (for filesystem adapter) */
  watchFiles?: boolean;

  /** Debounce time for saves in ms */
  saveDebounceMs?: number;
}

/**
 * ID mapping for file system persistence
 * Maps internal IDs to file paths
 */
export interface IdMap {
  notes: Record<string, string>;    // noteId -> relative file path
  systems: Record<string, string>;  // systemId -> folder name
  projects: Record<string, string>; // projectId -> folder name
}

/**
 * File metadata stored in YAML frontmatter
 */
export interface NoteFrontmatter {
  id: string;
  editorType: EditorType;
  tags?: string[];
  tagColors?: Record<string, string>;
  favorite?: boolean;
  color?: string;
  icon?: string | null;
  customType?: string;
  metrics?: {
    health?: string;
    priority?: string;
    lead?: string;
    targetDate?: string;
    status?: string;
  };
  created: string;  // ISO date string
  updated: string;  // ISO date string
}

/**
 * System metadata stored in _system.md frontmatter
 */
export interface SystemFrontmatter {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  tagColors?: Record<string, string>;
  color?: string;
  icon?: string;
  metrics?: {
    health?: string;
    priority?: string;
    lead?: string;
    targetDate?: string;
    status?: string;
  };
  created?: string;
  updated?: string;
}

/**
 * Project metadata stored in _project.md frontmatter
 */
export interface ProjectFrontmatter {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  tagColors?: Record<string, string>;
  color?: string;
  icon?: string;
  metrics?: {
    health?: string;
    priority?: string;
    lead?: string;
    targetDate?: string;
    status?: string;
  };
  created?: string;
  updated?: string;
}

/**
 * Storage keys for localStorage adapter
 */
export const STORAGE_KEYS = {
  SYSTEMS: 'kol-noter-systems',
  NOTES: 'kol-noter-notes',
  TRASH: 'kol-noter-trash',
  VAULT_CONFIG: 'kol-noter-vault-config',
} as const;

/**
 * File names and patterns for filesystem adapter
 */
export const FILE_PATTERNS = {
  SYSTEM_METADATA: '_system.md',
  PROJECT_METADATA: '_project.md',
  VISUAL_SIDECAR_SUFFIX: '.visual.json',
  ASSETS_DIR: '_assets',
  CONFIG_DIR: '.kol-noter',
  ID_MAP_FILE: 'id-map.json',
  SEARCH_INDEX_FILE: 'search-index.json',
  CONFIG_FILE: 'config.json',
} as const;
