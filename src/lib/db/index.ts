// Barrel export for the db module
export { getDb, closeDb } from './client';
export { queryKeys } from './query-keys';
export {
  upsertSystem,
  upsertProject,
  upsertNote,
  upsertTrashNote,
  deleteSystemFromIndex,
  deleteProjectFromIndex,
  deleteNoteFromIndex,
  deleteTrashNoteFromIndex,
  clearTrashIndex,
  fullReindex,
} from './indexer';

// React Query hooks
export { useSystems, useSystem } from './hooks/useSystems';
export { useProjects, useProject } from './hooks/useProjects';
export { useNotes, useNote, useNotesByProject, useNotesBySystem } from './hooks/useNotes';
export { useTrash } from './hooks/useTrash';
export { useAggregatedTags } from './hooks/useTags';
