/**
 * useSearch Hook
 *
 * React hook for full-text search across notes, systems, and projects.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { searchIndex, type SearchHit, type SearchOptions } from '@/lib/search';
import type { Note, System } from '@/store/notesStore';

export interface UseSearchOptions {
  /** Notes to index */
  notes: Note[];
  /** Systems to index (includes projects) */
  systems: System[];
  /** Vault path for caching (optional) */
  vaultPath?: string | null;
  /** Debounce delay in ms */
  debounceMs?: number;
}

export interface UseSearchReturn {
  /** Current search query */
  query: string;
  /** Set the search query */
  setQuery: (query: string) => void;
  /** Search results */
  results: SearchHit[];
  /** Whether search is in progress */
  isSearching: boolean;
  /** Whether index is ready */
  isIndexReady: boolean;
  /** Search with custom options */
  search: (query: string, options?: SearchOptions) => SearchHit[];
  /** Get autocomplete suggestions */
  suggest: (query: string) => string[];
  /** Rebuild the index */
  rebuildIndex: () => Promise<void>;
  /** Index statistics */
  stats: { documentCount: number; termCount: number };
}

/**
 * Default debounce delay
 */
const DEFAULT_DEBOUNCE_MS = 150;

export function useSearch({
  notes,
  systems,
  vaultPath,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseSearchOptions): UseSearchReturn {
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isIndexReady, setIsIndexReady] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout>();
  const lastBuildRef = useRef<string>('');

  // Build index when data changes
  useEffect(() => {
    // Create a hash of the data to detect changes
    const dataHash = `${notes.length}-${systems.length}-${notes.map(n => n.updatedAt).join(',')}`;

    if (dataHash === lastBuildRef.current) {
      return; // No changes
    }

    const buildIndex = async () => {
      setIsIndexReady(false);

      // Set vault path for caching
      if (vaultPath) {
        searchIndex.setVaultPath(vaultPath);

        // Try to load from cache first
        const cacheLoaded = await searchIndex.loadCache();
        if (cacheLoaded) {
          setIsIndexReady(true);
          lastBuildRef.current = dataHash;
          return;
        }
      }

      // Build fresh index
      await searchIndex.buildIndex(notes, systems);
      setIsIndexReady(true);
      lastBuildRef.current = dataHash;

      // Save to cache
      if (vaultPath) {
        await searchIndex.saveCache();
      }
    };

    buildIndex();
  }, [notes, systems, vaultPath]);

  // Debounced search
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    setIsSearching(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (!newQuery.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      const searchResults = searchIndex.search(newQuery);
      setResults(searchResults);
      setIsSearching(false);
    }, debounceMs);
  }, [debounceMs]);

  // Direct search (no debounce)
  const search = useCallback((searchQuery: string, options?: SearchOptions): SearchHit[] => {
    return searchIndex.search(searchQuery, options);
  }, []);

  // Autocomplete suggestions
  const suggest = useCallback((suggestQuery: string): string[] => {
    return searchIndex.suggest(suggestQuery);
  }, []);

  // Rebuild index manually
  const rebuildIndex = useCallback(async () => {
    setIsIndexReady(false);
    await searchIndex.buildIndex(notes, systems);
    setIsIndexReady(true);

    if (vaultPath) {
      await searchIndex.saveCache();
    }

    // Re-run current query
    if (query.trim()) {
      const searchResults = searchIndex.search(query);
      setResults(searchResults);
    }
  }, [notes, systems, vaultPath, query]);

  // Get stats
  const stats = useMemo(() => searchIndex.getStats(), [isIndexReady]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    isIndexReady,
    search,
    suggest,
    rebuildIndex,
    stats,
  };
}
