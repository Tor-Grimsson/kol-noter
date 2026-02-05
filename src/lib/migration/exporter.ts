/**
 * Migration Exporter
 *
 * Exports data from localStorage to the file system vault.
 * Handles notes, systems, projects, and attachments.
 */

import type { Note, System, Project } from '@/store/notesStore';
import { STORAGE_KEYS } from '@/lib/persistence/types';
import { filesystemAdapter } from '@/lib/persistence/filesystem-adapter';
import { attachmentManager } from '@/lib/attachments';

/**
 * Migration progress callback
 */
export type MigrationProgressCallback = (progress: MigrationProgress) => void;

/**
 * Migration progress info
 */
export interface MigrationProgress {
  phase: 'preparing' | 'systems' | 'projects' | 'notes' | 'attachments' | 'cleanup' | 'complete' | 'error';
  current: number;
  total: number;
  currentItem?: string;
  error?: string;
}

/**
 * Migration result
 */
export interface MigrationResult {
  success: boolean;
  systemsExported: number;
  projectsExported: number;
  notesExported: number;
  attachmentsExported: number;
  errors: string[];
  duration: number;
}

/**
 * Migration options
 */
export interface MigrationOptions {
  /** Clear localStorage after successful migration */
  clearLocalStorage?: boolean;
  /** Skip attachments (faster, but images won't work) */
  skipAttachments?: boolean;
  /** Progress callback */
  onProgress?: MigrationProgressCallback;
}

/**
 * Load data from localStorage
 */
function loadFromLocalStorage(): { systems: System[]; notes: Note[]; trash: Note[] } {
  const loadItem = <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  return {
    systems: loadItem<System[]>(STORAGE_KEYS.SYSTEMS, []),
    notes: loadItem<Note[]>(STORAGE_KEYS.NOTES, []),
    trash: loadItem<Note[]>(STORAGE_KEYS.TRASH, []),
  };
}

/**
 * Count total items for progress tracking
 */
function countItems(systems: System[], notes: Note[]): {
  systemCount: number;
  projectCount: number;
  noteCount: number;
  attachmentCount: number;
} {
  let projectCount = 0;
  let attachmentCount = 0;

  for (const system of systems) {
    projectCount += system.projects.length;
  }

  for (const note of notes) {
    if (note.attachments) {
      attachmentCount += Object.keys(note.attachments).length;
    }
  }

  return {
    systemCount: systems.length,
    projectCount,
    noteCount: notes.length,
    attachmentCount,
  };
}

/**
 * Validate localStorage data before migration
 */
export function validateLocalStorageData(): {
  valid: boolean;
  systems: number;
  projects: number;
  notes: number;
  attachments: number;
  errors: string[];
} {
  const errors: string[] = [];
  const { systems, notes } = loadFromLocalStorage();

  // Check for orphaned notes (notes with invalid system/project IDs)
  const systemIds = new Set(systems.map(s => s.id));
  const projectIds = new Set(systems.flatMap(s => s.projects.map(p => p.id)));

  for (const note of notes) {
    if (!systemIds.has(note.systemId)) {
      errors.push(`Note "${note.title}" has invalid systemId: ${note.systemId}`);
    }
    if (!projectIds.has(note.projectId)) {
      errors.push(`Note "${note.title}" has invalid projectId: ${note.projectId}`);
    }
  }

  const counts = countItems(systems, notes);

  return {
    valid: errors.length === 0,
    systems: counts.systemCount,
    projects: counts.projectCount,
    notes: counts.noteCount,
    attachments: counts.attachmentCount,
    errors,
  };
}

/**
 * Export localStorage data to file system vault
 */
export async function exportToVault(
  vaultPath: string,
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const { onProgress, clearLocalStorage = false, skipAttachments = false } = options;

  let systemsExported = 0;
  let projectsExported = 0;
  let notesExported = 0;
  let attachmentsExported = 0;

  try {
    // Phase: Preparing
    onProgress?.({
      phase: 'preparing',
      current: 0,
      total: 1,
      currentItem: 'Loading data from localStorage...',
    });

    const { systems, notes, trash } = loadFromLocalStorage();
    const counts = countItems(systems, notes);
    const totalItems = counts.systemCount + counts.projectCount + counts.noteCount +
                       (skipAttachments ? 0 : counts.attachmentCount);

    // Initialize vault
    await filesystemAdapter.setVaultPath(vaultPath, true);

    let currentProgress = 0;

    // Phase: Systems
    onProgress?.({
      phase: 'systems',
      current: 0,
      total: systems.length,
      currentItem: 'Exporting systems...',
    });

    for (const system of systems) {
      try {
        await filesystemAdapter.saveSystem(system);
        systemsExported++;
        currentProgress++;

        onProgress?.({
          phase: 'systems',
          current: systemsExported,
          total: systems.length,
          currentItem: system.name,
        });
      } catch (err) {
        errors.push(`Failed to export system "${system.name}": ${err}`);
      }
    }

    // Phase: Projects
    onProgress?.({
      phase: 'projects',
      current: 0,
      total: counts.projectCount,
      currentItem: 'Exporting projects...',
    });

    for (const system of systems) {
      for (const project of system.projects) {
        try {
          await filesystemAdapter.saveProject(system.id, project);
          projectsExported++;
          currentProgress++;

          onProgress?.({
            phase: 'projects',
            current: projectsExported,
            total: counts.projectCount,
            currentItem: `${system.name} / ${project.name}`,
          });
        } catch (err) {
          errors.push(`Failed to export project "${project.name}": ${err}`);
        }
      }
    }

    // Phase: Notes
    onProgress?.({
      phase: 'notes',
      current: 0,
      total: notes.length,
      currentItem: 'Exporting notes...',
    });

    for (const note of notes) {
      try {
        // Save note without attachments first
        const noteWithoutAttachments = { ...note, attachments: {} };
        await filesystemAdapter.saveNote(noteWithoutAttachments);
        notesExported++;
        currentProgress++;

        onProgress?.({
          phase: 'notes',
          current: notesExported,
          total: notes.length,
          currentItem: note.title,
        });

        // Export attachments if not skipped
        if (!skipAttachments && note.attachments) {
          for (const [filename, dataUrl] of Object.entries(note.attachments)) {
            try {
              await attachmentManager.saveAttachment(note.id, dataUrl, filename);
              attachmentsExported++;
              currentProgress++;

              onProgress?.({
                phase: 'attachments',
                current: attachmentsExported,
                total: counts.attachmentCount,
                currentItem: filename,
              });
            } catch (err) {
              errors.push(`Failed to export attachment "${filename}": ${err}`);
            }
          }
        }
      } catch (err) {
        errors.push(`Failed to export note "${note.title}": ${err}`);
      }
    }

    // Phase: Cleanup (optional)
    if (clearLocalStorage && errors.length === 0) {
      onProgress?.({
        phase: 'cleanup',
        current: 0,
        total: 1,
        currentItem: 'Clearing localStorage...',
      });

      localStorage.removeItem(STORAGE_KEYS.SYSTEMS);
      localStorage.removeItem(STORAGE_KEYS.NOTES);
      localStorage.removeItem(STORAGE_KEYS.TRASH);
    }

    // Phase: Complete
    onProgress?.({
      phase: 'complete',
      current: totalItems,
      total: totalItems,
    });

    return {
      success: errors.length === 0,
      systemsExported,
      projectsExported,
      notesExported,
      attachmentsExported,
      errors,
      duration: Date.now() - startTime,
    };

  } catch (err) {
    onProgress?.({
      phase: 'error',
      current: 0,
      total: 0,
      error: String(err),
    });

    return {
      success: false,
      systemsExported,
      projectsExported,
      notesExported,
      attachmentsExported,
      errors: [...errors, String(err)],
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Check if there's data in localStorage to migrate
 */
export function hasLocalStorageData(): boolean {
  const { systems, notes } = loadFromLocalStorage();
  return systems.length > 0 || notes.length > 0;
}

/**
 * Get localStorage data size estimate (in bytes)
 */
export function getLocalStorageSize(): number {
  let size = 0;

  for (const key of [STORAGE_KEYS.SYSTEMS, STORAGE_KEYS.NOTES, STORAGE_KEYS.TRASH]) {
    const item = localStorage.getItem(key);
    if (item) {
      size += item.length * 2; // UTF-16 = 2 bytes per char
    }
  }

  return size;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
