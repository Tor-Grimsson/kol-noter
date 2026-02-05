/**
 * useFileWatcher Hook
 *
 * React hook for subscribing to file system changes.
 * Automatically starts/stops watching based on vault path.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { fileWatcher, type FileChangeCallback } from '@/lib/watcher';
import { isTauri } from '@/lib/tauri-bridge';
import { type ExternalChangeEvent } from '@/lib/persistence/types';

export interface UseFileWatcherOptions {
  /** Path to the vault to watch */
  vaultPath: string | null;
  /** Whether watching is enabled */
  enabled?: boolean;
  /** Callback when a file changes */
  onFileChange?: FileChangeCallback;
}

export interface UseFileWatcherReturn {
  /** Whether the watcher is active */
  isWatching: boolean;
  /** Recent change events (for UI display) */
  recentChanges: ExternalChangeEvent[];
  /** Clear recent changes */
  clearRecentChanges: () => void;
  /** Last error if any */
  error: Error | null;
}

/**
 * Maximum number of recent changes to keep
 */
const MAX_RECENT_CHANGES = 10;

export function useFileWatcher({
  vaultPath,
  enabled = true,
  onFileChange,
}: UseFileWatcherOptions): UseFileWatcherReturn {
  const [isWatching, setIsWatching] = useState(false);
  const [recentChanges, setRecentChanges] = useState<ExternalChangeEvent[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to avoid stale closure in callback
  const onFileChangeRef = useRef(onFileChange);
  onFileChangeRef.current = onFileChange;

  // Handle incoming file changes
  const handleChange = useCallback((event: ExternalChangeEvent) => {
    // Add to recent changes
    setRecentChanges(prev => {
      const updated = [event, ...prev].slice(0, MAX_RECENT_CHANGES);
      return updated;
    });

    // Call user callback
    if (onFileChangeRef.current) {
      onFileChangeRef.current(event);
    }
  }, []);

  // Start/stop watcher based on vaultPath and enabled
  useEffect(() => {
    if (!isTauri() || !vaultPath || !enabled) {
      setIsWatching(false);
      return;
    }

    let mounted = true;

    const startWatch = async () => {
      try {
        const success = await fileWatcher.start(vaultPath);
        if (mounted) {
          setIsWatching(success);
          setError(success ? null : new Error('Failed to start file watcher'));
        }

        if (success) {
          fileWatcher.subscribe(handleChange);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setIsWatching(false);
        }
      }
    };

    startWatch();

    return () => {
      mounted = false;
      fileWatcher.stop();
    };
  }, [vaultPath, enabled, handleChange]);

  const clearRecentChanges = useCallback(() => {
    setRecentChanges([]);
  }, []);

  return {
    isWatching,
    recentChanges,
    clearRecentChanges,
    error,
  };
}
