import { createContext, useContext, ReactNode, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useVault } from "@/components/vault-system/VaultProvider";
import { filesystemAdapter } from "@/lib/persistence/filesystem-adapter";
import { generateSlug } from "@/lib/serialization/note-serializer";
import { getDb } from "@/lib/db/client";
import { queryKeys } from "@/lib/db/query-keys";
import {
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
} from "@/lib/db/indexer";
import { onFileChange } from "@/lib/watcher";
import { useSystems as useSqlSystems } from "@/lib/db/hooks/useSystems";
import { useNotes as useSqlNotes } from "@/lib/db/hooks/useNotes";
import { useTrash as useSqlTrash } from "@/lib/db/hooks/useTrash";

// Import types from extracted modules
import {
  EditorType,
  HealthStatus,
  PriorityLevel,
  ItemStatus,
  ItemMetrics,
  TagWithColor,
  TAG_COLOR_PRESETS,
  EXPLORER_COLORS,
  TAG_COLOR_INVERSES,
  EXPLORER_ICONS,
  Block,
  VisualNode,
  Reminder,
  Attachment,
  Photo,
  VoiceRecording,
  SavedLink,
  Contact,
  Project,
  System,
  Note,
  Page,
} from "@/lib/dummy-data";

// Re-export types for backward compatibility
export type { EditorType, HealthStatus, PriorityLevel, ItemStatus, ItemMetrics, TagWithColor };
export { TAG_COLOR_PRESETS, EXPLORER_COLORS, TAG_COLOR_INVERSES, EXPLORER_ICONS };
export type { Block, VisualNode, Reminder, Attachment, Photo, VoiceRecording, SavedLink, Contact, Project, System, Note, Page };

interface NotesStore {
  systems: System[];
  notes: Note[];
  notesRef: React.MutableRefObject<Note[]>;
  trash: Note[];
  isLoading: boolean;
  // System operations
  addSystem: (name: string) => System;
  updateSystem: (id: string, name: string) => void;
  updateSystemMetadata: (id: string, updates: Partial<Omit<System, "id" | "projects">>) => void;
  deleteSystem: (id: string) => void;
  getSystem: (id: string) => System | undefined;
  // Project operations
  addProject: (systemId: string, name: string) => Project | null;
  updateProject: (systemId: string, projectId: string, name: string) => void;
  updateProjectMetadata: (systemId: string, projectId: string, updates: Partial<Omit<Project, "id">>) => void;
  deleteProject: (systemId: string, projectId: string) => void;
  getProject: (systemId: string, projectId: string) => Project | undefined;
  // Note operations
  addNote: (systemId: string, projectId: string, editorType: EditorType) => Note;
  addPage: (noteId: string, title: string, editorType: EditorType) => Page | null;
  updateNote: (id: string, updates: Partial<Omit<Note, "id">>) => void;
  updateNoteContent: (id: string, content: Block[] | string | VisualNode[]) => void;
  saveAttachment: (noteId: string, filename: string, dataUrl: string) => void;
  deleteNote: (id: string) => void;
  restoreNote: (id: string) => void;
  permanentlyDeleteNote: (id: string) => void;
  emptyTrash: () => void;
  getNote: (id: string) => Note | undefined;
  getNotesByProject: (systemId: string, projectId: string) => Note[];
  getNotesBySystem: (systemId: string) => Note[];
  // Tag operations
  extractTagsFromContent: (noteId: string) => string[];
  syncAutoExtractedData: (noteId: string) => void;
  getAggregatedTags: (level: 'project' | 'system' | 'root', id?: string) => string[];
  getMetricsStats: (level: 'project' | 'system' | 'root', id?: string) => { good: number; warning: number; critical: number };
  updateNoteTagColor: (noteId: string, tagName: string, color: string) => void;
  updateProjectTagColor: (systemId: string, projectId: string, tagName: string, color: string) => void;
  updateSystemTagColor: (systemId: string, tagName: string, color: string) => void;
  // Contact operations
  addSystemContact: (systemId: string, contact: Omit<Contact, "id">) => void;
  removeSystemContact: (systemId: string, contactId: string) => void;
  addProjectContact: (systemId: string, projectId: string, contact: Omit<Contact, "id">) => void;
  removeProjectContact: (systemId: string, projectId: string, contactId: string) => void;
  // Metrics operations
  updateNoteMetrics: (noteId: string, metrics: Partial<ItemMetrics>) => void;
  updateProjectMetrics: (systemId: string, projectId: string, metrics: Partial<ItemMetrics>) => void;
  updateSystemMetrics: (systemId: string, metrics: Partial<ItemMetrics>) => void;
  // Color/Icon operations
  updateSystemColorIcon: (id: string, color?: string, icon?: string) => void;
  updateProjectColorIcon: (systemId: string, projectId: string, color?: string, icon?: string) => void;
  // Attachment operations
  addSystemAttachment: (systemId: string, attachment: Omit<Attachment, 'id' | 'createdAt'>) => void;
  removeSystemAttachment: (systemId: string, attachmentId: string) => void;
  addProjectAttachment: (systemId: string, projectId: string, attachment: Omit<Attachment, 'id' | 'createdAt'>) => void;
  removeProjectAttachment: (systemId: string, projectId: string, attachmentId: string) => void;
  // Photo operations
  addSystemPhoto: (systemId: string, name: string, dataUrl: string) => void;
  removeSystemPhoto: (systemId: string, photoId: string) => void;
  addProjectPhoto: (systemId: string, projectId: string, name: string, dataUrl: string) => void;
  removeProjectPhoto: (systemId: string, projectId: string, photoId: string) => void;
  // Voice recording operations
  addSystemVoiceRecording: (systemId: string, name: string, dataUrl: string, duration?: string) => void;
  removeSystemVoiceRecording: (systemId: string, recordingId: string) => void;
  addProjectVoiceRecording: (systemId: string, projectId: string, name: string, dataUrl: string, duration?: string) => void;
  removeProjectVoiceRecording: (systemId: string, projectId: string, recordingId: string) => void;
  // Link operations
  addSystemLink: (systemId: string, url: string, title?: string) => void;
  removeSystemLink: (systemId: string, linkId: string) => void;
  updateSystemLink: (systemId: string, linkId: string, updates: Partial<SavedLink>) => void;
  addProjectLink: (systemId: string, projectId: string, url: string, title?: string) => void;
  removeProjectLink: (systemId: string, projectId: string, linkId: string) => void;
  updateProjectLink: (systemId: string, projectId: string, linkId: string, updates: Partial<SavedLink>) => void;
  // Detail notes operations
  updateSystemDetailNotes: (systemId: string, notes: string) => void;
  updateProjectDetailNotes: (systemId: string, projectId: string, notes: string) => void;
  // Tag operations for system/project
  addSystemTag: (systemId: string, tag: string) => void;
  removeSystemTag: (systemId: string, tag: string) => void;
  addProjectTag: (systemId: string, projectId: string, tag: string) => void;
  removeProjectTag: (systemId: string, projectId: string, tag: string) => void;
  // Note-specific operations
  addNotePhoto: (noteId: string, name: string, dataUrl: string) => void;
  removeNotePhoto: (noteId: string, photoId: string) => void;
  addNoteVoiceRecording: (noteId: string, name: string, dataUrl: string, duration?: string) => void;
  removeNoteVoiceRecording: (noteId: string, recordingId: string) => void;
  addNoteLink: (noteId: string, url: string, title?: string) => void;
  removeNoteLink: (noteId: string, linkId: string) => void;
  updateNoteLink: (noteId: string, linkId: string, updates: Partial<SavedLink>) => void;
  addNoteTag: (noteId: string, tag: string) => void;
  removeNoteTag: (noteId: string, tag: string) => void;
  renameNoteTag: (noteId: string, oldTag: string, newTag: string) => void;
  updateNoteCustomType: (noteId: string, customType: string) => void;
  updateNoteDetailNotes: (noteId: string, detailNotes: string) => void;
  // Contact operations
  addNoteContact: (noteId: string, contact: Omit<Contact, "id">) => void;
  removeNoteContact: (noteId: string, contactId: string) => void;
  updateNoteContact: (noteId: string, contactId: string, updates: Partial<Contact>) => void;
}

// Context
const NotesContext = createContext<NotesStore | null>(null);

// Provider
export function NotesProvider({ children }: { children: ReactNode }) {
  const { isFilesystem, vaultPath } = useVault();
  const queryClient = useQueryClient();

  // ── React Query reads ─────────────────────────────────────────────
  const { data: systems = [], isLoading: systemsLoading } = useSqlSystems();
  const { data: notes = [], isLoading: notesLoading } = useSqlNotes();
  const { data: trash = [], isLoading: trashLoading } = useSqlTrash();

  const isLoading = systemsLoading || notesLoading || trashLoading;

  // Keep a ref for consumers that need synchronous access
  const notesRef = useRef<Note[]>(notes);
  notesRef.current = notes;

  // ── External file watcher ───────────────────────────────────────
  useEffect(() => {
    if (!isFilesystem || !vaultPath) return;

    const unsubscribe = onFileChange(async () => {
      try {
        const db = await getDb(vaultPath);
        const data = await filesystemAdapter.loadAll();
        await fullReindex(db, data);
        queryClient.invalidateQueries();
      } catch (err) {
        console.error('[NotesStore] External change reload failed:', err);
      }
    });

    return unsubscribe;
  }, [isFilesystem, vaultPath, queryClient]);

  // ── Helpers ───────────────────────────────────────────────────────

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const formatDate = () => new Date().toLocaleString();

  /**
   * Persist a system to filesystem + SQLite, then invalidate queries.
   * Optimistically updates the React Query cache so data is available immediately.
   */
  const persistSystem = useCallback(async (system: System) => {
    // Cancel in-flight refetches so they don't overwrite the optimistic update
    await queryClient.cancelQueries({ queryKey: queryKeys.systems.all });
    // Optimistic update — make data available to consumers immediately
    queryClient.setQueryData<System[]>(queryKeys.systems.all, (old = []) => {
      const idx = old.findIndex(s => s.id === system.id);
      if (idx >= 0) {
        const updated = [...old];
        updated[idx] = system;
        return updated;
      }
      return [...old, system];
    });

    if (!isFilesystem || !vaultPath) return;
    try {
      await filesystemAdapter.saveSystem(system);
      const db = await getDb(vaultPath);
      await upsertSystem(db, system);
      for (const project of system.projects) {
        await upsertProject(db, system.id, project);
      }
    } catch (err) {
      console.error('[NotesStore] Failed to persist system:', err);
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.systems.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.tags.aggregated('root') });
  }, [isFilesystem, vaultPath, queryClient]);

  /**
   * Persist a project to filesystem + SQLite, then invalidate queries.
   * Optimistically updates the React Query cache so data is available immediately.
   */
  const persistProject = useCallback(async (systemId: string, project: Project) => {
    // Cancel in-flight refetches so they don't overwrite the optimistic update
    await queryClient.cancelQueries({ queryKey: queryKeys.systems.all });
    // Optimistic update — update the project within its parent system
    queryClient.setQueryData<System[]>(queryKeys.systems.all, (old = []) => {
      return old.map(s => {
        if (s.id !== systemId) return s;
        const pidx = s.projects.findIndex(p => p.id === project.id);
        if (pidx >= 0) {
          const projects = [...s.projects];
          projects[pidx] = project;
          return { ...s, projects };
        }
        return { ...s, projects: [...s.projects, project] };
      });
    });

    if (!isFilesystem || !vaultPath) return;
    try {
      await filesystemAdapter.saveProject(systemId, project);
      const db = await getDb(vaultPath);
      await upsertProject(db, systemId, project);
    } catch (err) {
      console.error('[NotesStore] Failed to persist project:', err);
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.systems.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.tags.aggregated('root') });
  }, [isFilesystem, vaultPath, queryClient]);

  /**
   * Persist a note to filesystem + SQLite, then invalidate queries.
   * Optimistically updates the React Query cache so data is available immediately.
   */
  const persistNote = useCallback(async (note: Note) => {
    // Cancel in-flight refetches so they don't overwrite the optimistic update
    await queryClient.cancelQueries({ queryKey: queryKeys.notes.all });
    // Optimistic update — make data available to consumers immediately
    queryClient.setQueryData<Note[]>(queryKeys.notes.all, (old = []) => {
      const idx = old.findIndex(n => n.id === note.id);
      if (idx >= 0) {
        const updated = [...old];
        updated[idx] = note;
        return updated;
      }
      return [note, ...old];
    });

    if (!isFilesystem || !vaultPath) return;
    try {
      await filesystemAdapter.saveNote(note);
      const db = await getDb(vaultPath);
      // Read latest state from cache to include concurrent updates (e.g. attachments)
      const latestNote = queryClient.getQueryData<Note[]>(queryKeys.notes.all)?.find(n => n.id === note.id) ?? note;
      await upsertNote(db, latestNote);
    } catch (err) {
      console.error('[NotesStore] Failed to persist note:', err);
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.tags.aggregated('root') });
  }, [isFilesystem, vaultPath, queryClient]);

  // ── System operations ─────────────────────────────────────────────

  const addSystem = (name: string): System => {
    const newSystem: System = {
      id: generateId(),
      name,
      projects: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    persistSystem(newSystem);
    return newSystem;
  };

  const updateSystem = (id: string, name: string) => {
    const system = systems.find(s => s.id === id);
    if (!system) return;
    const updated = { ...system, name, updatedAt: Date.now() };

    // Optimistic update — show new name in UI immediately
    queryClient.setQueryData<System[]>(queryKeys.systems.all, (old = []) => {
      const idx = old.findIndex(s => s.id === id);
      if (idx >= 0) {
        const copy = [...old];
        copy[idx] = updated;
        return copy;
      }
      return old;
    });

    if (isFilesystem && system.name !== name) {
      // Rename folder on disk before persisting (idMap must update first)
      filesystemAdapter.renameSystem(id, name).then(() => {
        persistSystem(updated);
      }).catch(err => {
        console.error('[NotesStore] Failed to rename system on disk:', err);
        persistSystem(updated);
      });
    } else {
      persistSystem(updated);
    }
  };

  const deleteSystem = (id: string) => {
    // Optimistic removal
    queryClient.setQueryData<System[]>(queryKeys.systems.all, (old = []) => old.filter(s => s.id !== id));
    queryClient.setQueryData<Note[]>(queryKeys.notes.all, (old = []) => old.filter(n => n.systemId !== id));

    if (!isFilesystem || !vaultPath) return;
    (async () => {
      try {
        await filesystemAdapter.deleteSystem(id);
        const db = await getDb(vaultPath);
        await deleteSystemFromIndex(db, id);
      } catch (err) {
        console.error('[NotesStore] Failed to delete system:', err);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.systems.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.aggregated('root') });
    })();
  };

  const updateSystemMetadata = (id: string, updates: Partial<Omit<System, "id" | "projects">>) => {
    const system = systems.find(s => s.id === id);
    if (!system) return;
    const updated = { ...system, ...updates, updatedAt: Date.now() };
    persistSystem(updated);
  };

  const getSystem = (id: string): System | undefined => {
    return systems.find(s => s.id === id);
  };

  // ── Project operations ────────────────────────────────────────────

  const addProject = (systemId: string, name: string): Project | null => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return null;

    const newProject: Project = {
      id: generateId(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    persistProject(systemId, newProject);
    // Also update system's updatedAt
    persistSystem({ ...system, projects: [...system.projects, newProject], updatedAt: Date.now() });

    return newProject;
  };

  const updateProject = (systemId: string, projectId: string, name: string) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const updated = { ...project, name, updatedAt: Date.now() };

    // Optimistic update — show new name in UI immediately
    queryClient.setQueryData<System[]>(queryKeys.systems.all, (old = []) => {
      return old.map(s => {
        if (s.id !== systemId) return s;
        const pidx = s.projects.findIndex(p => p.id === projectId);
        if (pidx >= 0) {
          const projects = [...s.projects];
          projects[pidx] = updated;
          return { ...s, projects };
        }
        return s;
      });
    });

    if (isFilesystem && project.name !== name) {
      filesystemAdapter.renameProject(projectId, name).then(() => {
        persistProject(systemId, updated);
      }).catch(err => {
        console.error('[NotesStore] Failed to rename project on disk:', err);
        persistProject(systemId, updated);
      });
    } else {
      persistProject(systemId, updated);
    }
  };

  const deleteProject = (systemId: string, projectId: string) => {
    // Optimistic removal
    queryClient.setQueryData<System[]>(queryKeys.systems.all, (old = []) =>
      old.map(s => s.id !== systemId ? s : { ...s, projects: s.projects.filter(p => p.id !== projectId) })
    );
    queryClient.setQueryData<Note[]>(queryKeys.notes.all, (old = []) =>
      old.filter(n => !(n.systemId === systemId && n.projectId === projectId))
    );

    if (!isFilesystem || !vaultPath) return;
    (async () => {
      try {
        await filesystemAdapter.deleteProject(systemId, projectId);
        const db = await getDb(vaultPath);
        await deleteProjectFromIndex(db, projectId);
      } catch (err) {
        console.error('[NotesStore] Failed to delete project:', err);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.systems.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.aggregated('root') });
    })();
  };

  const updateProjectMetadata = (systemId: string, projectId: string, updates: Partial<Omit<Project, "id">>) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const updated = { ...project, ...updates, updatedAt: Date.now() };
    persistProject(systemId, updated);
  };

  const getProject = (systemId: string, projectId: string): Project | undefined => {
    const system = systems.find(s => s.id === systemId);
    return system?.projects.find(p => p.id === projectId);
  };

  // ── Note operations ───────────────────────────────────────────────

  const addNote = (systemId: string, projectId: string, editorType: EditorType): Note => {
    const now = Date.now();
    let defaultContent: Block[] | string | VisualNode[];

    switch (editorType) {
      case "standard":
        defaultContent = "";
        break;
      case "visual":
        defaultContent = [
          { id: generateId(), type: "start", label: "Start", x: 200, y: 100 },
        ];
        break;
      case "modular":
      default:
        defaultContent = [];
        break;
    }

    const noteId = generateId();
    const indexPage: Page = {
      id: `${noteId}-index`,
      noteId,
      slug: 'index',
      title: 'Untitled',
      preview: '',
      order: 0,
      editorType,
      content: defaultContent,
      createdAt: now,
      updatedAt: now,
    };

    const newNote: Note = {
      id: noteId,
      title: "Untitled",
      preview: "",
      date: formatDate(),
      tags: [],
      systemId,
      projectId,
      pages: [indexPage],
      editorType,
      content: defaultContent,
      createdAt: now,
      updatedAt: now,
    };

    persistNote(newNote);
    return newNote;
  };

  const addPage = (noteId: string, title: string, editorType: EditorType): Page | null => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return null;

    const now = Date.now();
    let defaultContent: Block[] | string | VisualNode[];
    switch (editorType) {
      case "standard": defaultContent = ""; break;
      case "visual": defaultContent = [{ id: generateId(), type: "start" as const, label: "Start", x: 200, y: 100 }]; break;
      case "modular": default: defaultContent = []; break;
    }

    const existingSlugs = (note.pages || []).map(p => p.slug);
    let slug = generateSlug(title || 'untitled');
    if (existingSlugs.includes(slug)) {
      let counter = 1;
      while (existingSlugs.includes(`${slug}-${counter}`)) counter++;
      slug = `${slug}-${counter}`;
    }

    const maxOrder = Math.max(0, ...(note.pages || []).map(p => p.order));

    const newPage: Page = {
      id: generateId(),
      noteId,
      slug,
      title: title || 'Untitled',
      preview: '',
      order: maxOrder + 1,
      editorType,
      content: defaultContent,
      createdAt: now,
      updatedAt: now,
    };

    const updatedNote: Note = {
      ...note,
      pages: [...(note.pages || []), newPage],
      updatedAt: now,
    };

    persistNote(updatedNote);
    return newPage;
  };

  const updateNote = (id: string, updates: Partial<Omit<Note, "id">>) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const updated: Note = { ...note, ...updates, updatedAt: Date.now() };

    // Optimistic update — show changes in UI immediately
    queryClient.setQueryData<Note[]>(queryKeys.notes.all, (old = []) => {
      const idx = old.findIndex(n => n.id === id);
      if (idx >= 0) {
        const copy = [...old];
        copy[idx] = updated;
        return copy;
      }
      return old;
    });

    if (isFilesystem && updates.title && updates.title !== note.title) {
      filesystemAdapter.renameNote(id, updates.title).then(() => {
        persistNote(updated);
      }).catch(err => {
        console.error('[NotesStore] Failed to rename note on disk:', err);
        persistNote(updated);
      });
    } else {
      persistNote(updated);
    }
  };

  const updateNoteContent = (id: string, content: Block[] | string | VisualNode[]) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    let title = note.title;
    let preview = note.preview;

    if (typeof content === "string") {
      const headingMatch = content.match(/^#\s+(.+)$/m);
      if (headingMatch) {
        title = headingMatch[1].trim();
      }
      preview = content.replace(/^#+\s+/gm, "").slice(0, 100).trim();
    } else if (Array.isArray(content) && content.length > 0) {
      const firstItem = content[0] as any;

      if (firstItem.type && ["heading", "paragraph", "code", "list", "image", "section"].includes(firstItem.type)) {
        const headingBlock = (content as Block[]).find(b => b.type === "heading");
        if (headingBlock && headingBlock.content) {
          title = headingBlock.content.trim();
        }
        const contentBlock = (content as Block[]).find(b => b.content && b.type !== "section");
        if (contentBlock) {
          preview = contentBlock.content.slice(0, 100).trim();
        }
      } else if (firstItem.type && ["start", "process", "decision", "end"].includes(firstItem.type)) {
        if (firstItem.label && firstItem.label !== "Start") {
          title = firstItem.label;
        }
        preview = `Flowchart with ${content.length} nodes`;
      }
    }

    const updated: Note = {
      ...note,
      title,
      content,
      preview,
      date: "Just now",
      updatedAt: Date.now(),
    };

    if (isFilesystem && title !== note.title) {
      filesystemAdapter.renameNote(id, title).then(() => {
        persistNote(updated);
      }).catch(err => {
        console.error('[NotesStore] Failed to rename note on disk:', err);
        persistNote(updated);
      });
    } else {
      persistNote(updated);
    }

    // Sync auto-extracted tags after content save
    syncAutoExtractedData(id);
  };

  const saveAttachment = (noteId: string, filename: string, dataUrl: string) => {
    // Optimistic update — merge attachment into current cache state (not stale `notes`)
    queryClient.setQueryData<Note[]>(queryKeys.notes.all, (old = []) =>
      old.map(n => {
        if (n.id !== noteId) return n;
        return {
          ...n,
          attachments: { ...(n.attachments || {}), [filename]: dataUrl },
          updatedAt: Date.now(),
        };
      })
    );

    // Persist: save attachment file + targeted SQLite update + frontmatter
    if (isFilesystem && vaultPath) {
      (async () => {
        try {
          await filesystemAdapter.saveAttachment(noteId, filename, dataUrl);
          // Read latest from cache (includes concurrent content updates)
          const db = await getDb(vaultPath);
          const latestNote = queryClient.getQueryData<Note[]>(queryKeys.notes.all)?.find(n => n.id === noteId);
          if (latestNote) {
            await upsertNote(db, latestNote);
            await filesystemAdapter.saveNote(latestNote);
          }
        } catch (err) {
          console.error('[NotesStore] Failed to save attachment:', err);
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
      })();
    }
  };

  const deleteNote = (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (!noteToDelete) return;

    // Optimistic: move from notes to trash
    queryClient.setQueryData<Note[]>(queryKeys.notes.all, (old = []) => old.filter(n => n.id !== id));
    queryClient.setQueryData<Note[]>(queryKeys.trash.all, (old = []) => [noteToDelete, ...old]);

    if (isFilesystem && vaultPath) {
      (async () => {
        try {
          await filesystemAdapter.deleteNote(id);
          const db = await getDb(vaultPath);
          await deleteNoteFromIndex(db, id);
          await upsertTrashNote(db, noteToDelete);
        } catch (err) {
          console.error('[NotesStore] Failed to delete note:', err);
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.trash.all });
      })();
    }
  };

  const restoreNote = (id: string) => {
    const noteToRestore = trash.find(n => n.id === id);
    if (!noteToRestore) return;

    // Optimistic: move from trash to notes
    queryClient.setQueryData<Note[]>(queryKeys.trash.all, (old = []) => old.filter(n => n.id !== id));
    queryClient.setQueryData<Note[]>(queryKeys.notes.all, (old = []) => [noteToRestore, ...old]);

    if (isFilesystem && vaultPath) {
      (async () => {
        try {
          await filesystemAdapter.restoreNote(id);
          const db = await getDb(vaultPath);
          await deleteTrashNoteFromIndex(db, id);
          await upsertNote(db, noteToRestore);
        } catch (err) {
          console.error('[NotesStore] Failed to restore note:', err);
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.trash.all });
      })();
    }
  };

  const permanentlyDeleteNote = (id: string) => {
    // Optimistic removal from trash
    queryClient.setQueryData<Note[]>(queryKeys.trash.all, (old = []) => old.filter(n => n.id !== id));

    if (isFilesystem && vaultPath) {
      (async () => {
        try {
          await filesystemAdapter.permanentlyDeleteNote(id);
          const db = await getDb(vaultPath);
          await deleteTrashNoteFromIndex(db, id);
        } catch (err) {
          console.error('[NotesStore] Failed to permanently delete note:', err);
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.trash.all });
      })();
    }
  };

  const emptyTrash = () => {
    // Optimistic clear
    queryClient.setQueryData<Note[]>(queryKeys.trash.all, []);

    if (isFilesystem && vaultPath) {
      (async () => {
        try {
          await filesystemAdapter.emptyTrash();
          const db = await getDb(vaultPath);
          await clearTrashIndex(db);
        } catch (err) {
          console.error('[NotesStore] Failed to empty trash:', err);
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.trash.all });
      })();
    }
  };

  const getNote = (id: string): Note | undefined => {
    return notes.find(n => n.id === id);
  };

  const getNotesByProject = (systemId: string, projectId: string): Note[] => {
    return notes.filter(n => n.systemId === systemId && n.projectId === projectId);
  };

  const getNotesBySystem = (systemId: string): Note[] => {
    return notes.filter(n => n.systemId === systemId);
  };

  // ── Tag extraction & sync ─────────────────────────────────────────

  const extractTagsFromContent = (noteId: string): string[] => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return [];

    let content = '';
    if (typeof note.content === 'string') {
      content = note.content;
    } else if (Array.isArray(note.content)) {
      const first = note.content[0] as any;
      if (first?.type && ["heading", "paragraph", "code", "list", "image", "section"].includes(first.type)) {
        content = (note.content as Block[]).map(b => b.content || '').join(' ');
      }
    }

    const matches = content.match(/#(\w+)/g) || [];
    return [...new Set(matches.map(m => m.slice(1)))];
  };

  const syncAutoExtractedData = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const extractedTags = extractTagsFromContent(noteId);
    const existingTags = note.tags || [];
    const allTags = [...new Set([...existingTags, ...extractedTags])];

    let content = '';
    if (typeof note.content === 'string') {
      content = note.content;
    } else if (Array.isArray(note.content)) {
      const first = note.content[0] as any;
      if (first?.type && ["heading", "paragraph", "code", "list", "image", "section"].includes(first.type)) {
        content = (note.content as Block[]).map(b => b.content || '').join(' ');
      }
    }
    const urlMatches = content.match(/(?:https?:\/\/|www\.)[^\s)]+/g) || [];
    const existingLinks = note.links || [];
    const autoExtractedUrls = urlMatches.filter(url => !existingLinks.some(l => l.url === url));

    const newLinks = autoExtractedUrls.map(url => {
      const normalizedUrl = url.startsWith('www.') ? `https://${url}` : url;
      return {
        id: `link_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        url: normalizedUrl,
        title: url.split('/').pop() || url,
        addedAt: Date.now(),
      };
    });

    if (allTags.length > existingTags.length || newLinks.length > 0) {
      const updated: Note = {
        ...note,
        tags: allTags,
        links: [...existingLinks, ...newLinks],
        updatedAt: Date.now(),
      };
      persistNote(updated);
    }
  };

  const getAggregatedTags = (level: 'project' | 'system' | 'root', id?: string): string[] => {
    const allTags: string[] = [];

    switch (level) {
      case 'project': {
        if (!id) return [];
        const projectNotes = notes.filter(n => n.projectId === id);
        projectNotes.forEach(note => {
          allTags.push(...(note.tags || []));
        });
        break;
      }
      case 'system': {
        if (!id) return [];
        const systemNotes = notes.filter(n => n.systemId === id);
        systemNotes.forEach(note => {
          allTags.push(...(note.tags || []));
        });
        const system = systems.find(s => s.id === id);
        system?.projects.forEach(p => {
          allTags.push(...(p.tags || []));
        });
        break;
      }
      case 'root': {
        notes.forEach(note => {
          allTags.push(...(note.tags || []));
        });
        systems.forEach(system => {
          allTags.push(...(system.tags || []));
          system.projects.forEach(p => {
            allTags.push(...(p.tags || []));
          });
        });
        break;
      }
    }

    return [...new Set(allTags)];
  };

  const getMetricsStats = (level: 'project' | 'system' | 'root', id?: string): { good: number; warning: number; critical: number } => {
    const stats = { good: 0, warning: 0, critical: 0 };

    switch (level) {
      case 'project': {
        if (!id) return stats;
        const projectNotes = notes.filter(n => n.projectId === id);
        projectNotes.forEach(note => {
          if (note.metrics?.health === 'good') stats.good++;
          else if (note.metrics?.health === 'warning') stats.warning++;
          else if (note.metrics?.health === 'critical') stats.critical++;
        });
        break;
      }
      case 'system': {
        if (!id) return stats;
        const systemNotes = notes.filter(n => n.systemId === id);
        systemNotes.forEach(note => {
          if (note.metrics?.health === 'good') stats.good++;
          else if (note.metrics?.health === 'warning') stats.warning++;
          else if (note.metrics?.health === 'critical') stats.critical++;
        });
        const system = systems.find(s => s.id === id);
        system?.projects.forEach(p => {
          if (p.metrics?.health === 'good') stats.good++;
          else if (p.metrics?.health === 'warning') stats.warning++;
          else if (p.metrics?.health === 'critical') stats.critical++;
        });
        break;
      }
      case 'root': {
        notes.forEach(note => {
          if (note.metrics?.health === 'good') stats.good++;
          else if (note.metrics?.health === 'warning') stats.warning++;
          else if (note.metrics?.health === 'critical') stats.critical++;
        });
        systems.forEach(system => {
          system.projects.forEach(p => {
            if (p.metrics?.health === 'good') stats.good++;
            else if (p.metrics?.health === 'warning') stats.warning++;
            else if (p.metrics?.health === 'critical') stats.critical++;
          });
          if (system.metrics?.health === 'good') stats.good++;
          else if (system.metrics?.health === 'warning') stats.warning++;
          else if (system.metrics?.health === 'critical') stats.critical++;
        });
        break;
      }
    }

    return stats;
  };

  // ── Tag color operations ──────────────────────────────────────────

  const updateNoteTagColor = (noteId: string, tagName: string, color: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated: Note = {
      ...note,
      tagColors: { ...note.tagColors, [tagName]: color },
      updatedAt: Date.now(),
    };
    persistNote(updated);
  };

  const updateProjectTagColor = (systemId: string, projectId: string, tagName: string, color: string) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const updated = {
      ...project,
      tagColors: { ...project.tagColors, [tagName]: color },
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  const updateSystemTagColor = (systemId: string, tagName: string, color: string) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const updated = {
      ...system,
      tagColors: { ...system.tagColors, [tagName]: color },
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  // ── Metrics operations ────────────────────────────────────────────

  const updateNoteMetrics = (noteId: string, metrics: Partial<ItemMetrics>) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated: Note = {
      ...note,
      metrics: { ...note.metrics, ...metrics },
      updatedAt: Date.now(),
    };
    persistNote(updated);
  };

  const updateProjectMetrics = (systemId: string, projectId: string, metrics: Partial<ItemMetrics>) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const updated = {
      ...project,
      metrics: { ...project.metrics, ...metrics },
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  const updateSystemMetrics = (systemId: string, metrics: Partial<ItemMetrics>) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const updated = {
      ...system,
      metrics: { ...system.metrics, ...metrics },
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  // ── Color/Icon operations ─────────────────────────────────────────

  const updateSystemColorIcon = (id: string, color?: string, icon?: string) => {
    const system = systems.find(s => s.id === id);
    if (!system) return;
    const updated = {
      ...system,
      ...(color !== undefined && { color }),
      ...(icon !== undefined && { icon }),
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  const updateProjectColorIcon = (systemId: string, projectId: string, color?: string, icon?: string) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const updated = {
      ...project,
      ...(color !== undefined && { color }),
      ...(icon !== undefined && { icon }),
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  // ── Attachment operations ─────────────────────────────────────────

  const addSystemAttachment = (systemId: string, attachment: Omit<Attachment, 'id' | 'createdAt'>) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const newAttachment: Attachment = { ...attachment, id: crypto.randomUUID(), createdAt: Date.now() };
    const updated = {
      ...system,
      attachments: [...(system.attachments || []), newAttachment],
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  const removeSystemAttachment = (systemId: string, attachmentId: string) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const updated = {
      ...system,
      attachments: (system.attachments || []).filter(a => a.id !== attachmentId),
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  const addProjectAttachment = (systemId: string, projectId: string, attachment: Omit<Attachment, 'id' | 'createdAt'>) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const newAttachment: Attachment = { ...attachment, id: crypto.randomUUID(), createdAt: Date.now() };
    const updated = {
      ...project,
      attachments: [...(project.attachments || []), newAttachment],
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  const removeProjectAttachment = (systemId: string, projectId: string, attachmentId: string) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const updated = {
      ...project,
      attachments: (project.attachments || []).filter(a => a.id !== attachmentId),
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  // ── Photo operations ──────────────────────────────────────────────

  const addSystemPhoto = (systemId: string, name: string, dataUrl: string) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const newPhoto: Photo = { id: crypto.randomUUID(), name, dataUrl, addedAt: Date.now() };
    const updated = {
      ...system,
      photos: [...(system.photos || []), newPhoto],
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  const removeSystemPhoto = (systemId: string, photoId: string) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const updated = {
      ...system,
      photos: (system.photos || []).filter(p => p.id !== photoId),
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  const addProjectPhoto = (systemId: string, projectId: string, name: string, dataUrl: string) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const newPhoto: Photo = { id: crypto.randomUUID(), name, dataUrl, addedAt: Date.now() };
    const updated = {
      ...project,
      photos: [...(project.photos || []), newPhoto],
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  const removeProjectPhoto = (systemId: string, projectId: string, photoId: string) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const updated = {
      ...project,
      photos: (project.photos || []).filter(p => p.id !== photoId),
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  // ── Voice recording operations ────────────────────────────────────

  const addSystemVoiceRecording = (systemId: string, name: string, dataUrl: string, duration?: string) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const newRec: VoiceRecording = { id: crypto.randomUUID(), name, dataUrl, duration, addedAt: Date.now() };
    const updated = {
      ...system,
      voiceRecordings: [...(system.voiceRecordings || []), newRec],
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  const removeSystemVoiceRecording = (systemId: string, recordingId: string) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const updated = {
      ...system,
      voiceRecordings: (system.voiceRecordings || []).filter(r => r.id !== recordingId),
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  const addProjectVoiceRecording = (systemId: string, projectId: string, name: string, dataUrl: string, duration?: string) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const newRec: VoiceRecording = { id: crypto.randomUUID(), name, dataUrl, duration, addedAt: Date.now() };
    const updated = {
      ...project,
      voiceRecordings: [...(project.voiceRecordings || []), newRec],
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  const removeProjectVoiceRecording = (systemId: string, projectId: string, recordingId: string) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const updated = {
      ...project,
      voiceRecordings: (project.voiceRecordings || []).filter(r => r.id !== recordingId),
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  // ── Link operations ───────────────────────────────────────────────

  const addSystemLink = (systemId: string, url: string, title?: string) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const newLink: SavedLink = { id: crypto.randomUUID(), url, title, addedAt: Date.now() };
    const updated = {
      ...system,
      links: [...(system.links || []), newLink],
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  const removeSystemLink = (systemId: string, linkId: string) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const updated = {
      ...system,
      links: (system.links || []).filter(l => l.id !== linkId),
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  const updateSystemLink = (systemId: string, linkId: string, updates: Partial<SavedLink>) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const updated = {
      ...system,
      links: (system.links || []).map(l => l.id !== linkId ? l : { ...l, ...updates }),
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  const addProjectLink = (systemId: string, projectId: string, url: string, title?: string) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const newLink: SavedLink = { id: crypto.randomUUID(), url, title, addedAt: Date.now() };
    const updated = {
      ...project,
      links: [...(project.links || []), newLink],
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  const removeProjectLink = (systemId: string, projectId: string, linkId: string) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const updated = {
      ...project,
      links: (project.links || []).filter(l => l.id !== linkId),
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  const updateProjectLink = (systemId: string, projectId: string, linkId: string, updates: Partial<SavedLink>) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const updated = {
      ...project,
      links: (project.links || []).map(l => l.id !== linkId ? l : { ...l, ...updates }),
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  // ── Detail notes operations ───────────────────────────────────────

  const updateSystemDetailNotes = (systemId: string, detailNotes: string) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const updated = { ...system, detailNotes, updatedAt: Date.now() };
    persistSystem(updated);
  };

  const updateProjectDetailNotes = (systemId: string, projectId: string, detailNotes: string) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const updated = { ...project, detailNotes, updatedAt: Date.now() };
    persistProject(systemId, updated);
  };

  // ── Tag operations for system/project ─────────────────────────────

  const addSystemTag = (systemId: string, tag: string) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const updated = {
      ...system,
      tags: [...new Set([...(system.tags || []), tag.toLowerCase()])],
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  const removeSystemTag = (systemId: string, tag: string) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const updated = {
      ...system,
      tags: (system.tags || []).filter(t => t !== tag),
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  const addProjectTag = (systemId: string, projectId: string, tag: string) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const updated = {
      ...project,
      tags: [...new Set([...(project.tags || []), tag.toLowerCase()])],
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  const removeProjectTag = (systemId: string, projectId: string, tag: string) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const updated = {
      ...project,
      tags: (project.tags || []).filter(t => t !== tag),
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  // ── Contact operations ────────────────────────────────────────────

  const addSystemContact = (systemId: string, contact: Omit<Contact, "id">) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const newContact: Contact = { id: crypto.randomUUID(), ...contact };
    const updated = {
      ...system,
      contacts: [...(system.contacts || []), newContact],
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  const removeSystemContact = (systemId: string, contactId: string) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return;
    const updated = {
      ...system,
      contacts: (system.contacts || []).filter(c => c.id !== contactId),
      updatedAt: Date.now(),
    };
    persistSystem(updated);
  };

  const addProjectContact = (systemId: string, projectId: string, contact: Omit<Contact, "id">) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const newContact: Contact = { id: crypto.randomUUID(), ...contact };
    const updated = {
      ...project,
      contacts: [...(project.contacts || []), newContact],
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  const removeProjectContact = (systemId: string, projectId: string, contactId: string) => {
    const system = systems.find(s => s.id === systemId);
    const project = system?.projects.find(p => p.id === projectId);
    if (!project) return;
    const updated = {
      ...project,
      contacts: (project.contacts || []).filter(c => c.id !== contactId),
      updatedAt: Date.now(),
    };
    persistProject(systemId, updated);
  };

  // ── Note-specific operations ──────────────────────────────────────

  const addNotePhoto = (noteId: string, name: string, dataUrl: string) => {
    const newPhoto: Photo = { id: crypto.randomUUID(), name, dataUrl, addedAt: Date.now() };

    // Optimistic update — merge photo into current cache state (not stale `notes`)
    queryClient.setQueryData<Note[]>(queryKeys.notes.all, (old = []) =>
      old.map(n => {
        if (n.id !== noteId) return n;
        return {
          ...n,
          photos: [...(n.photos || []), newPhoto],
          updatedAt: Date.now(),
        };
      })
    );

    // Save the photo file and update SQLite + frontmatter
    if (isFilesystem && vaultPath) {
      (async () => {
        try {
          await filesystemAdapter.saveAttachment(noteId, name, dataUrl);
          // Read latest from cache (includes concurrent content/attachment updates)
          const db = await getDb(vaultPath);
          const latestNote = queryClient.getQueryData<Note[]>(queryKeys.notes.all)?.find(n => n.id === noteId);
          if (latestNote) {
            await upsertNote(db, latestNote);
            await filesystemAdapter.saveNote(latestNote);
          }
        } catch (err) {
          console.error('[NotesStore] Failed to save photo:', err);
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
      })();
    }
  };

  const removeNotePhoto = (noteId: string, photoId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated: Note = {
      ...note,
      photos: (note.photos || []).filter(p => p.id !== photoId),
      updatedAt: Date.now(),
    };
    persistNote(updated);
  };

  const addNoteVoiceRecording = (noteId: string, name: string, dataUrl: string, duration?: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const newRec: VoiceRecording = { id: crypto.randomUUID(), name, dataUrl, duration, addedAt: Date.now() };
    const updated: Note = {
      ...note,
      voiceRecordings: [...(note.voiceRecordings || []), newRec],
      updatedAt: Date.now(),
    };
    persistNote(updated);
  };

  const removeNoteVoiceRecording = (noteId: string, recordingId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated: Note = {
      ...note,
      voiceRecordings: (note.voiceRecordings || []).filter(r => r.id !== recordingId),
      updatedAt: Date.now(),
    };
    persistNote(updated);
  };

  const addNoteLink = (noteId: string, url: string, title?: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const newLink: SavedLink = { id: crypto.randomUUID(), url, title, addedAt: Date.now() };
    const updated: Note = {
      ...note,
      links: [...(note.links || []), newLink],
      updatedAt: Date.now(),
    };
    persistNote(updated);
  };

  const removeNoteLink = (noteId: string, linkId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated: Note = {
      ...note,
      links: (note.links || []).filter(l => l.id !== linkId),
      updatedAt: Date.now(),
    };
    persistNote(updated);
  };

  const updateNoteLink = (noteId: string, linkId: string, updates: Partial<SavedLink>) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated: Note = {
      ...note,
      links: (note.links || []).map(l => l.id !== linkId ? l : { ...l, ...updates }),
      updatedAt: Date.now(),
    };
    persistNote(updated);
  };

  const addNoteTag = (noteId: string, tag: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated: Note = {
      ...note,
      tags: [...new Set([...(note.tags || []), tag.toLowerCase()])],
      updatedAt: Date.now(),
    };
    persistNote(updated);
  };

  const removeNoteTag = (noteId: string, tag: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated: Note = {
      ...note,
      tags: (note.tags || []).filter(t => t !== tag),
      updatedAt: Date.now(),
    };
    persistNote(updated);
  };

  const renameNoteTag = (noteId: string, oldTag: string, newTag: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const tags = (note.tags || []).map(t => t === oldTag ? newTag.toLowerCase() : t);
    const tagColors = note.tagColors ? { ...note.tagColors } : {};
    if (tagColors[oldTag]) {
      tagColors[newTag.toLowerCase()] = tagColors[oldTag];
      delete tagColors[oldTag];
    }
    const updated: Note = {
      ...note,
      tags: [...new Set(tags)],
      tagColors,
      updatedAt: Date.now(),
    };
    persistNote(updated);
  };

  const updateNoteCustomType = (noteId: string, customType: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated: Note = {
      ...note,
      customType: customType || undefined,
      updatedAt: Date.now(),
    };
    persistNote(updated);
  };

  const updateNoteDetailNotes = (noteId: string, detailNotes: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated: Note = { ...note, detailNotes, updatedAt: Date.now() };
    persistNote(updated);
  };

  const addNoteContact = (noteId: string, contact: Omit<Contact, "id">) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const newContact: Contact = { ...contact, id: crypto.randomUUID() };
    const updated: Note = {
      ...note,
      contacts: [...(note.contacts || []), newContact],
      updatedAt: Date.now(),
    };
    persistNote(updated);
  };

  const removeNoteContact = (noteId: string, contactId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated: Note = {
      ...note,
      contacts: (note.contacts || []).filter(c => c.id !== contactId),
      updatedAt: Date.now(),
    };
    persistNote(updated);
  };

  const updateNoteContact = (noteId: string, contactId: string, updates: Partial<Contact>) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated: Note = {
      ...note,
      contacts: (note.contacts || []).map(c => c.id !== contactId ? c : { ...c, ...updates }),
      updatedAt: Date.now(),
    };
    persistNote(updated);
  };

  // ── Store object ──────────────────────────────────────────────────

  const store: NotesStore = {
    systems,
    notes,
    notesRef,
    trash,
    isLoading,
    addSystem,
    updateSystem,
    updateSystemMetadata,
    deleteSystem,
    getSystem,
    addProject,
    updateProject,
    updateProjectMetadata,
    deleteProject,
    getProject,
    addNote,
    addPage,
    updateNote,
    updateNoteContent,
    saveAttachment,
    deleteNote,
    restoreNote,
    permanentlyDeleteNote,
    emptyTrash,
    getNote,
    getNotesByProject,
    getNotesBySystem,
    extractTagsFromContent,
    syncAutoExtractedData,
    getAggregatedTags,
    getMetricsStats,
    updateNoteTagColor,
    updateProjectTagColor,
    updateSystemTagColor,
    updateNoteMetrics,
    updateProjectMetrics,
    updateSystemMetrics,
    updateSystemColorIcon,
    updateProjectColorIcon,
    addSystemAttachment,
    removeSystemAttachment,
    addProjectAttachment,
    removeProjectAttachment,
    addSystemPhoto,
    removeSystemPhoto,
    addProjectPhoto,
    removeProjectPhoto,
    addSystemVoiceRecording,
    removeSystemVoiceRecording,
    addProjectVoiceRecording,
    removeProjectVoiceRecording,
    addSystemLink,
    removeSystemLink,
    updateSystemLink,
    addProjectLink,
    removeProjectLink,
    updateProjectLink,
    updateSystemDetailNotes,
    updateProjectDetailNotes,
    addSystemTag,
    removeSystemTag,
    addProjectTag,
    removeProjectTag,
    addSystemContact,
    removeSystemContact,
    addProjectContact,
    removeProjectContact,
    addNotePhoto,
    removeNotePhoto,
    addNoteVoiceRecording,
    removeNoteVoiceRecording,
    addNoteLink,
    removeNoteLink,
    updateNoteLink,
    addNoteTag,
    removeNoteTag,
    renameNoteTag,
    updateNoteCustomType,
    updateNoteDetailNotes,
    addNoteContact,
    removeNoteContact,
    updateNoteContact,
  };

  return (
    <NotesContext.Provider value={store}>
      {children}
    </NotesContext.Provider>
  );
}

// Hook to use the store
export function useNotesStore() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotesStore must be used within a NotesProvider");
  }
  return context;
}
