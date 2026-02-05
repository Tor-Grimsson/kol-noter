/**
 * Search Command
 *
 * Command palette style search component for finding notes, systems, and projects.
 * Can be triggered with Cmd+K / Ctrl+K.
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Folder, FolderOpen, X, Hash } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { type SearchHit } from '@/lib/search';

export interface SearchCommandProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Search results */
  results: SearchHit[];
  /** Current query */
  query: string;
  /** Called when query changes */
  onQueryChange: (query: string) => void;
  /** Whether search is in progress */
  isSearching?: boolean;
  /** Called when a result is selected */
  onSelect: (result: SearchHit) => void;
  /** Autocomplete suggestions */
  suggestions?: string[];
}

/**
 * Get icon for result type
 */
function getResultIcon(type: SearchHit['type']) {
  switch (type) {
    case 'note':
      return FileText;
    case 'system':
      return Folder;
    case 'project':
      return FolderOpen;
    default:
      return FileText;
  }
}

/**
 * Highlight matched text in a string
 */
function highlightMatches(text: string, matches: string[] = []): React.ReactNode {
  if (!matches.length) {
    return text;
  }

  // Simple highlight - just return the text for now
  // A more sophisticated version would highlight the actual match positions
  return text;
}

export function SearchCommand({
  open,
  onOpenChange,
  results,
  query,
  onQueryChange,
  isSearching,
  onSelect,
  suggestions = [],
}: SearchCommandProps) {
  // Group results by type
  const noteResults = results.filter(r => r.type === 'note');
  const systemResults = results.filter(r => r.type === 'system');
  const projectResults = results.filter(r => r.type === 'project');

  const handleSelect = useCallback((result: SearchHit) => {
    onSelect(result);
    onOpenChange(false);
  }, [onSelect, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search notes, systems, projects..."
        value={query}
        onValueChange={onQueryChange}
      />
      <CommandList>
        {isSearching && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}

        {!isSearching && query && results.length === 0 && (
          <CommandEmpty>No results found for "{query}"</CommandEmpty>
        )}

        {!query && suggestions.length > 0 && (
          <CommandGroup heading="Suggestions">
            {suggestions.map((suggestion, i) => (
              <CommandItem
                key={i}
                onSelect={() => onQueryChange(suggestion)}
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
                {suggestion}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {noteResults.length > 0 && (
          <CommandGroup heading="Notes">
            {noteResults.map(result => {
              const Icon = getResultIcon(result.type);
              return (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                  className="flex items-start gap-3 py-3"
                >
                  <Icon className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {highlightMatches(result.title, result.matches?.title)}
                    </div>
                    {result.preview && (
                      <div className="text-sm text-muted-foreground truncate">
                        {result.preview}
                      </div>
                    )}
                    {result.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {result.tags.slice(0, 3).map(tag => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs px-1.5 py-0"
                          >
                            <Hash className="w-3 h-3 mr-0.5" />
                            {tag}
                          </Badge>
                        ))}
                        {result.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{result.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {Math.round(result.score)}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {systemResults.length > 0 && (
          <>
            {noteResults.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Systems">
              {systemResults.map(result => {
                const Icon = getResultIcon(result.type);
                return (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{result.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {projectResults.length > 0 && (
          <>
            {(noteResults.length > 0 || systemResults.length > 0) && <CommandSeparator />}
            <CommandGroup heading="Projects">
              {projectResults.map(result => {
                const Icon = getResultIcon(result.type);
                return (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{result.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Hook to handle Cmd+K / Ctrl+K keyboard shortcut
 */
export function useSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);
}
