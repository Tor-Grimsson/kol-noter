/**
 * Vault Provider
 *
 * Manages vault initialization and provides vault context to the app.
 * Shows loading/setup UI until vault is ready.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Loader2, FolderOpen, Plus, AlertCircle, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isTauri, pickVaultFolder, getDefaultVaultPath, isValidVault } from '@/lib/tauri-bridge';
import { initializePersistence, getActiveAdapter, isUsingFilesystem } from '@/lib/persistence';
import { filesystemAdapter } from '@/lib/persistence/filesystem-adapter';
import { fileWatcher } from '@/lib/watcher';
import { searchIndex } from '@/lib/search';
import { getDb } from '@/lib/db/client';
import { fullReindex } from '@/lib/db/indexer';
import { MigrationWizard } from './MigrationWizard';
import { hasLocalStorageData } from '@/lib/migration';

/**
 * Vault context value
 */
interface VaultContextValue {
  /** Whether vault is initialized and ready */
  isReady: boolean;
  /** Whether vault is still loading */
  isLoading: boolean;
  /** Error message if vault failed to initialize */
  error: string | null;
  /** Whether using filesystem (Tauri) or localStorage */
  isFilesystem: boolean;
  /** Current vault path (null for localStorage) */
  vaultPath: string | null;
  /** Open vault selector */
  selectVault: () => Promise<void>;
  /** Create new vault */
  createVault: () => Promise<void>;
  /** Open migration wizard */
  openMigrationWizard: () => void;
  /** Switch to localStorage mode */
  useLocalStorage: () => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

/**
 * Hook to access vault context
 */
export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within VaultProvider');
  }
  return context;
}

/**
 * Vault provider props
 */
interface VaultProviderProps {
  children: ReactNode;
}

/**
 * App state
 */
type AppState = 'loading' | 'setup' | 'ready' | 'error';

/**
 * Vault Provider Component
 */
export function VaultProvider({ children }: VaultProviderProps) {
  const [appState, setAppState] = useState<AppState>('loading');
  const [vaultPath, setVaultPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMigrationWizard, setShowMigrationWizard] = useState(false);

  const isFilesystem = isTauri() && vaultPath !== null;
  const isInTauri = isTauri();

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      // First check if we're in Tauri - if so, show setup UI while we check for vault
      if (!isInTauri) {
        // Browser mode - use localStorage immediately
        setAppState('ready');
        return;
      }

      // In Tauri, check for stored vault config
      const path = await initializePersistence();

      if (path) {
        setVaultPath(path);

        // Start file watcher
        await fileWatcher.start(path);

        // Initialize search index vault path
        searchIndex.setVaultPath(path);

        // Initialize SQLite index BEFORE rendering children
        // (children read from SQLite, so it must be populated first)
        try {
          const db = await getDb(path);
          const data = await filesystemAdapter.loadAll();
          await fullReindex(db, data);
        } catch (err) {
          console.error('[VaultProvider] Failed to initialize SQLite index:', err);
        }

        // Now safe to render children — SQLite has data
        setAppState('ready');
      } else {
        // No vault configured - stay in setup mode
        setAppState('setup');
      }
    };

    init();

    return () => {
      fileWatcher.stop();
    };
  }, [isInTauri]);

  // Select existing vault
  const selectVault = useCallback(async () => {
    try {
      const selected = await pickVaultFolder({
        title: 'Select Existing Vault',
      });

      if (!selected) return;

      const valid = await isValidVault(selected);
      if (!valid) {
        setError('Selected folder is not a valid KOL Noter vault.');
        return;
      }

      await filesystemAdapter.setVaultPath(selected, false);
      setVaultPath(selected);
      setError(null);

      // Start file watcher
      await fileWatcher.start(selected);
      searchIndex.setVaultPath(selected);

      // Initialize SQLite index BEFORE rendering children
      try {
        const db = await getDb(selected);
        const data = await filesystemAdapter.loadAll();
        await fullReindex(db, data);
      } catch (err) {
        console.error('[VaultProvider] Failed to initialize SQLite index:', err);
      }

      setAppState('ready');
    } catch (err) {
      setError(String(err));
    }
  }, []);

  // Create new vault
  const createVault = useCallback(async () => {
    try {
      const defaultPath = await getDefaultVaultPath();
      const selected = await pickVaultFolder({
        title: 'Select Location for New Vault',
        defaultPath,
      });

      if (!selected) return;

      await filesystemAdapter.setVaultPath(selected, true);
      setVaultPath(selected);
      setError(null);

      // Start file watcher
      await fileWatcher.start(selected);
      searchIndex.setVaultPath(selected);

      // Initialize SQLite index (empty vault) BEFORE rendering children
      try {
        const db = await getDb(selected);
        await fullReindex(db, { systems: [], notes: [], trash: [] });
      } catch (err) {
        console.error('[VaultProvider] Failed to initialize SQLite index:', err);
      }

      setAppState('ready');

      // Note: We don't auto-migrate localStorage data to new vaults.
      // If user wants to migrate, they can use the migration option from the menu.
    } catch (err) {
      setError(String(err));
    }
  }, []);

  // Use localStorage mode
  const useLocalStorage = useCallback(() => {
    setVaultPath(null);
    setAppState('ready');
    setError(null);
  }, []);

  // Open migration wizard
  const openMigrationWizard = useCallback(() => {
    setShowMigrationWizard(true);
  }, []);

  // Context value
  const contextValue: VaultContextValue = {
    isReady: appState === 'ready',
    isLoading: appState === 'loading',
    error,
    isFilesystem,
    vaultPath,
    selectVault,
    createVault,
    openMigrationWizard,
    useLocalStorage,
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading KOL Noter...</p>
        </div>
      </div>
    );
  }

  // Setup state (Tauri, no vault)
  if (appState === 'setup') {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <HardDrive className="w-12 h-12 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Welcome to KOL Noter</h1>
            <p className="text-muted-foreground">
              Choose where to store your notes. Files are saved as markdown for easy editing in other apps.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              className="w-full justify-start h-auto py-4"
              variant="outline"
              onClick={createVault}
            >
              <Plus className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Create New Vault</div>
                <div className="text-xs text-muted-foreground">
                  Start fresh with a new folder
                </div>
              </div>
            </Button>

            <Button
              className="w-full justify-start h-auto py-4"
              variant="outline"
              onClick={selectVault}
            >
              <FolderOpen className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Open Existing Vault</div>
                <div className="text-xs text-muted-foreground">
                  Select a folder you've used before
                </div>
              </div>
            </Button>

            {hasLocalStorageData() && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  Found existing browser data. After creating a vault, use the Vault menu to migrate.
                </p>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              className="text-sm text-muted-foreground hover:text-foreground underline"
              onClick={useLocalStorage}
            >
              Continue with browser storage
            </button>
          </div>
        </div>

        <MigrationWizard
          open={showMigrationWizard}
          onOpenChange={setShowMigrationWizard}
        />
      </div>
    );
  }

  // Error state
  if (appState === 'error') {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-md w-full space-y-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <div>
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-muted-foreground mt-2">{error}</p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()}>
              Reload App
            </Button>
            <Button variant="outline" onClick={useLocalStorage}>
              Use Browser Storage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Ready state - render children
  return (
    <VaultContext.Provider value={contextValue}>
      {children}
      <MigrationWizard
        open={showMigrationWizard}
        onOpenChange={setShowMigrationWizard}
      />
    </VaultContext.Provider>
  );
}
