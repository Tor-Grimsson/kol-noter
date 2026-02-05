/**
 * Persistence Layer
 *
 * Main entry point for the persistence abstraction layer.
 * Provides access to the appropriate adapter based on environment.
 */

export * from './types';
export { LocalStorageAdapter, localStorageAdapter } from './localStorage-adapter';
export { FilesystemAdapter, filesystemAdapter } from './filesystem-adapter';

import { isTauri } from '@/lib/tauri-bridge';
import type { IPersistenceAdapter } from './types';
import { localStorageAdapter } from './localStorage-adapter';
import { filesystemAdapter } from './filesystem-adapter';

/**
 * Get the appropriate persistence adapter for the current environment
 */
export function getAdapter(): IPersistenceAdapter {
  if (isTauri()) {
    return filesystemAdapter;
  }
  return localStorageAdapter;
}

/**
 * Current active adapter
 */
let activeAdapter: IPersistenceAdapter | null = null;

/**
 * Initialize the persistence layer
 * Returns the vault path if using filesystem adapter, null for localStorage
 */
export async function initializePersistence(): Promise<string | null> {
  activeAdapter = getAdapter();

  if (!activeAdapter.isAvailable()) {
    // Fall back to localStorage if primary adapter isn't available
    activeAdapter = localStorageAdapter;
  }

  return activeAdapter.initialize();
}

/**
 * Get the current active adapter
 */
export function getActiveAdapter(): IPersistenceAdapter {
  if (!activeAdapter) {
    activeAdapter = getAdapter();
  }
  return activeAdapter;
}

/**
 * Check if we're using the filesystem adapter
 */
export function isUsingFilesystem(): boolean {
  return activeAdapter?.name === 'filesystem';
}
