/**
 * File Watcher
 *
 * Watches the vault directory for external changes (edits from Obsidian, VS Code, etc.)
 * and emits events to update the React store.
 */

import { watch, type WatchEvent, type UnwatchFn } from '@tauri-apps/plugin-fs';
import { isTauri, joinPath, getFilename, getDirname, pathExists } from '@/lib/tauri-bridge';
import { FILE_PATTERNS, type ExternalChangeEvent, type ExternalChangeType } from '@/lib/persistence/types';

/**
 * Debounce configuration for file events
 * (Multiple events often fire for a single save)
 */
const DEBOUNCE_MS = 300;

/**
 * File change callback type
 */
export type FileChangeCallback = (event: ExternalChangeEvent) => void;

/**
 * Watcher state
 */
interface WatcherState {
  unwatch: UnwatchFn | null;
  callbacks: Set<FileChangeCallback>;
  pendingEvents: Map<string, NodeJS.Timeout>;
  vaultPath: string;
}

/**
 * Global watcher state
 */
const state: WatcherState = {
  unwatch: null,
  callbacks: new Set(),
  pendingEvents: new Map(),
  vaultPath: '',
};

/**
 * Determine the type of change from file path
 */
function getChangeType(
  path: string,
  eventType: string
): { type: ExternalChangeType; itemType: 'note' | 'system' | 'project' } | null {
  const filename = getFilename(path);

  // Ignore hidden files and directories
  if (filename.startsWith('.')) {
    return null;
  }

  // Ignore sidecar files (handle with main file)
  if (path.endsWith(FILE_PATTERNS.VISUAL_SIDECAR_SUFFIX)) {
    return null;
  }

  // System metadata
  if (filename === FILE_PATTERNS.SYSTEM_METADATA) {
    const baseType = eventType === 'create' ? 'system-created' :
                     eventType === 'remove' ? 'system-deleted' : 'system-updated';
    return { type: baseType as ExternalChangeType, itemType: 'system' };
  }

  // Project metadata
  if (filename === FILE_PATTERNS.PROJECT_METADATA) {
    const baseType = eventType === 'create' ? 'project-created' :
                     eventType === 'remove' ? 'project-deleted' : 'project-updated';
    return { type: baseType as ExternalChangeType, itemType: 'project' };
  }

  // Regular markdown files (notes)
  if (path.endsWith('.md') && !filename.startsWith('_')) {
    const baseType = eventType === 'create' ? 'note-created' :
                     eventType === 'remove' ? 'note-deleted' : 'note-updated';
    return { type: baseType as ExternalChangeType, itemType: 'note' };
  }

  return null;
}

/**
 * Process a file system event
 */
function processEvent(event: WatchEvent): void {
  // Handle different event structures
  const paths = Array.isArray(event.paths) ? event.paths : [event.paths];
  const eventType = typeof event.type === 'string' ? event.type :
                    (event.type as any)?.modify ? 'modify' :
                    (event.type as any)?.create ? 'create' :
                    (event.type as any)?.remove ? 'remove' : 'unknown';

  for (const path of paths) {
    if (!path || typeof path !== 'string') continue;

    // Ignore paths outside vault
    if (!path.startsWith(state.vaultPath)) continue;

    // Ignore .kol-noter config directory
    if (path.includes(`/${FILE_PATTERNS.CONFIG_DIR}/`)) continue;

    // Ignore assets directory changes (handled separately)
    if (path.includes(`/${FILE_PATTERNS.ASSETS_DIR}/`)) continue;

    const changeInfo = getChangeType(path, eventType);
    if (!changeInfo) continue;

    // Debounce: cancel existing timeout for this path
    const existingTimeout = state.pendingEvents.get(path);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new debounced event
    const timeout = setTimeout(() => {
      state.pendingEvents.delete(path);

      const externalEvent: ExternalChangeEvent = {
        type: changeInfo.type,
        path: path.replace(state.vaultPath + '/', ''),
        itemType: changeInfo.itemType,
        timestamp: Date.now(),
      };

      // Notify all callbacks
      for (const callback of state.callbacks) {
        try {
          callback(externalEvent);
        } catch (error) {
          console.error('File watcher callback error:', error);
        }
      }
    }, DEBOUNCE_MS);

    state.pendingEvents.set(path, timeout);
  }
}

/**
 * Start watching a vault directory
 */
export async function startWatching(vaultPath: string): Promise<boolean> {
  if (!isTauri()) {
    console.warn('File watching requires Tauri');
    return false;
  }

  // Stop existing watcher if any
  await stopWatching();

  state.vaultPath = vaultPath;

  try {
    // Watch the vault directory recursively
    state.unwatch = await watch(
      vaultPath,
      processEvent,
      { recursive: true }
    );

    console.log(`File watcher started for: ${vaultPath}`);
    return true;
  } catch (error) {
    console.error('Failed to start file watcher:', error);
    return false;
  }
}

/**
 * Stop watching
 */
export async function stopWatching(): Promise<void> {
  if (state.unwatch) {
    await state.unwatch();
    state.unwatch = null;
  }

  // Clear pending events
  for (const timeout of state.pendingEvents.values()) {
    clearTimeout(timeout);
  }
  state.pendingEvents.clear();

  state.vaultPath = '';
}

/**
 * Subscribe to file change events
 * Returns unsubscribe function
 */
export function onFileChange(callback: FileChangeCallback): () => void {
  state.callbacks.add(callback);

  return () => {
    state.callbacks.delete(callback);
  };
}

/**
 * Check if watcher is active
 */
export function isWatching(): boolean {
  return state.unwatch !== null;
}

/**
 * Get the currently watched vault path
 */
export function getWatchedPath(): string {
  return state.vaultPath;
}

/**
 * FileWatcher class for object-oriented usage
 */
export class FileWatcher {
  private unsubscribers: Array<() => void> = [];

  /**
   * Start watching a vault
   */
  async start(vaultPath: string): Promise<boolean> {
    return startWatching(vaultPath);
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    // Unsubscribe all listeners
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];

    await stopWatching();
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback: FileChangeCallback): void {
    const unsub = onFileChange(callback);
    this.unsubscribers.push(unsub);
  }

  /**
   * Check if watching
   */
  get isActive(): boolean {
    return isWatching();
  }
}

/**
 * Singleton file watcher instance
 */
export const fileWatcher = new FileWatcher();
