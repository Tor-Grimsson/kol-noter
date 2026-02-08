/**
 * React Query key factory for SQLite-backed queries.
 *
 * Centralised key definitions make invalidation predictable:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.notes.all })
 */

export const queryKeys = {
  systems: {
    all: ['systems'] as const,
    detail: (id: string) => ['systems', id] as const,
  },
  projects: {
    all: ['projects'] as const,
    bySystem: (systemId: string) => ['projects', 'bySystem', systemId] as const,
    detail: (systemId: string, projectId: string) =>
      ['projects', systemId, projectId] as const,
  },
  notes: {
    all: ['notes'] as const,
    detail: (id: string) => ['notes', id] as const,
    byProject: (systemId: string, projectId: string) =>
      ['notes', 'byProject', systemId, projectId] as const,
    bySystem: (systemId: string) =>
      ['notes', 'bySystem', systemId] as const,
  },
  trash: {
    all: ['trash'] as const,
  },
  tags: {
    aggregated: (level: string, id?: string) =>
      ['tags', 'aggregated', level, id ?? '__root__'] as const,
  },
};
