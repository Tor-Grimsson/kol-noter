/**
 * usePersistence Hook
 *
 * React hook for managing persistence layer state and operations.
 * Provides access to the current adapter and vault management functions.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  initializePersistence,
  getActiveAdapter,
  isUsingFilesystem,
  type IPersistenceAdapter,
  type VaultData,
  type ExternalChangeEvent,
} from '@/lib/persistence';
import { isTauri, pickVaultFolder, getDefaultVaultPath } from '@/lib/tauri-bridge';
import { filesystemAdapter } from '@/lib/persistence/filesystem-adapter';

export interface PersistenceState {
  /** Whether the persistence layer is initialized */
  isInitialized: boolean;
  /** Whether we're currently loading */
  isLoading: boolean;
  /** Current adapter name */
  adapterName: string;
  /** Vault path (for filesystem adapter) */
  vaultPath: string | null;
  /** Whether filesystem is available (Tauri) */
  isFilesystemAvailable: boolean;
  /** Error if initialization failed */
  error: Error | null;
}

export interface PersistenceActions {
  /** Load all data from storage */
  loadAll: () => Promise<VaultData>;
  /** Select a vault folder (opens dialog) */
  selectVault: () => Promise<boolean>;
  /** Create a new vault at specified path */
  createVault: (path?: string) => Promise<boolean>;
  /** Switch to localStorage adapter */
  useLocalStorage: () => void;
  /** Subscribe to external changes */
  onExternalChange: (callback: (event: ExternalChangeEvent) => void) => () => void;
}

export function usePersistence(): [PersistenceState, PersistenceActions] {
  const [state, setState] = useState<PersistenceState>({
    isInitialized: false,
    isLoading: true,
    adapterName: 'localStorage',
    vaultPath: null,
    isFilesystemAvailable: false,
    error: null,
  });

  // Initialize on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const vaultPath = await initializePersistence();
        const adapter = getActiveAdapter();

        if (mounted) {
          setState({
            isInitialized: true,
            isLoading: false,
            adapterName: adapter.name,
            vaultPath,
            isFilesystemAvailable: isTauri(),
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error as Error,
          }));
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const loadAll = useCallback(async (): Promise<VaultData> => {
    const adapter = getActiveAdapter();
    return adapter.loadAll();
  }, []);

  const selectVault = useCallback(async (): Promise<boolean> => {
    if (!isTauri()) {
      return false;
    }

    try {
      const path = await pickVaultFolder({
        title: 'Select KOL Noter Vault Folder',
      });

      if (!path) {
        return false; // User cancelled
      }

      await filesystemAdapter.setVaultPath(path, false);

      setState(prev => ({
        ...prev,
        adapterName: 'filesystem',
        vaultPath: filesystemAdapter.getVaultPath(),
      }));

      return true;
    } catch (error) {
      // If vault is invalid, offer to create new
      console.error('Failed to select vault:', error);
      return false;
    }
  }, []);

  const createVault = useCallback(async (customPath?: string): Promise<boolean> => {
    if (!isTauri()) {
      return false;
    }

    try {
      let path = customPath;

      if (!path) {
        // Pick a folder
        path = await pickVaultFolder({
          title: 'Select Location for New Vault',
        });
      }

      if (!path) {
        return false; // User cancelled
      }

      await filesystemAdapter.setVaultPath(path, true);

      setState(prev => ({
        ...prev,
        adapterName: 'filesystem',
        vaultPath: filesystemAdapter.getVaultPath(),
      }));

      return true;
    } catch (error) {
      console.error('Failed to create vault:', error);
      return false;
    }
  }, []);

  const useLocalStorage = useCallback(() => {
    setState(prev => ({
      ...prev,
      adapterName: 'localStorage',
      vaultPath: null,
    }));
  }, []);

  const onExternalChange = useCallback((callback: (event: ExternalChangeEvent) => void) => {
    const adapter = getActiveAdapter();
    if (adapter.onExternalChange) {
      return adapter.onExternalChange(callback);
    }
    return () => {}; // No-op for localStorage
  }, []);

  return [
    state,
    {
      loadAll,
      selectVault,
      createVault,
      useLocalStorage,
      onExternalChange,
    },
  ];
}
