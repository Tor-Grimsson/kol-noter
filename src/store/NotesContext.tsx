import { createContext, useContext, ReactNode, useState, useEffect, useRef } from "react";
import { useVault } from "@/components/vault-system/VaultProvider";
import { filesystemAdapter } from "@/lib/persistence/filesystem-adapter";

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
} from "@/lib/dummy-data";

// Re-export types for backward compatibility
export type { EditorType, HealthStatus, PriorityLevel, ItemStatus, ItemMetrics, TagWithColor };
export { TAG_COLOR_PRESETS, EXPLORER_COLORS, TAG_COLOR_INVERSES, EXPLORER_ICONS };
export type { Block, VisualNode, Reminder, Attachment, Photo, VoiceRecording, SavedLink, Contact, Project, System, Note };

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
  const { isFilesystem, vaultPath, isReady } = useVault();

  const [systems, setSystems] = useState<System[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [trash, setTrash] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const notesRef = useRef<Note[]>([]); // Always current

  // Keep ref in sync with notes
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Track if we've loaded data (to avoid re-loading)
  const hasLoadedRef = useRef(false);

  // Load data from appropriate adapter
  useEffect(() => {
    // Don't load until vault is ready
    if (!isReady) return;

    // Don't re-load if we've already loaded
    if (hasLoadedRef.current) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        if (isFilesystem && vaultPath) {
          const data = await filesystemAdapter.loadAll();
          setSystems(data.systems);
          setNotes(data.notes);
          setTrash(data.trash);
        } else {
          setSystems([]);
          setNotes([]);
          setTrash([]);
        }
        hasLoadedRef.current = true;
      } catch (error) {
        console.error('[NotesStore] Failed to load data:', error);
        setSystems([]);
        setNotes([]);
        setTrash([]);
        hasLoadedRef.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isReady, isFilesystem, vaultPath]);

  // Generate unique ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Format relative date
  const formatDate = () => {
    return new Date().toLocaleString();
  };

  // System operations
  const addSystem = (name: string): System => {
    const newSystem: System = {
      id: generateId(),
      name,
      projects: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const newSystems = [...systems, newSystem];
    setSystems(newSystems);

    // Save to appropriate adapter
    if (isFilesystem) {
      filesystemAdapter.saveSystem(newSystem).catch(err =>
        console.error('[NotesStore] Failed to save system to filesystem:', err)
      );
    }

    return newSystem;
  };

  const updateSystem = (id: string, name: string) => {
    const newSystems = systems.map(s => s.id === id ? { ...s, name, updatedAt: Date.now() } : s);
    setSystems(newSystems);

    // Save to appropriate adapter
    const updatedSystem = newSystems.find(s => s.id === id);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to update system in filesystem:', err)
      );
    }
  };

  const deleteSystem = (id: string) => {
    const newSystems = systems.filter(s => s.id !== id);
    const newNotes = notes.filter(n => n.systemId !== id);
    setSystems(newSystems);
    // Also delete all notes in this system
    setNotes(newNotes);

    // Save to appropriate adapter
    if (isFilesystem) {
      filesystemAdapter.deleteSystem(id).catch(err =>
        console.error('[NotesStore] Failed to delete system from filesystem:', err)
      );
    }
  };

  const updateSystemMetadata = (id: string, updates: Partial<Omit<System, "id" | "projects">>) => {
    const newSystems = systems.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        ...updates,
        updatedAt: Date.now(),
      };
    });
    setSystems(newSystems);

    // Save to appropriate adapter
    const updatedSystem = newSystems.find(s => s.id === id);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to update system metadata in filesystem:', err)
      );
    }
  };

  const getSystem = (id: string): System | undefined => {
    return systems.find(s => s.id === id);
  };

  // Project operations
  const addProject = (systemId: string, name: string): Project | null => {
    const newProject: Project = {
      id: generateId(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const systemIndex = systems.findIndex(s => s.id === systemId);
    if (systemIndex === -1) return null;

    const updatedSystems = [...systems];
    updatedSystems[systemIndex] = {
      ...updatedSystems[systemIndex],
      projects: [...updatedSystems[systemIndex].projects, newProject],
      updatedAt: Date.now(),
    };
    setSystems(updatedSystems);

    // Save to appropriate adapter
    if (isFilesystem) {
      filesystemAdapter.saveProject(systemId, newProject).catch(err =>
        console.error('[NotesStore] Failed to save project to filesystem:', err)
      );
    }

    return newProject;
  };

  const updateProject = (systemId: string, projectId: string, name: string) => {
    const newSystems = systems.map(s => {
      if (s.id !== systemId) return s;
      return {
        ...s,
        projects: s.projects.map(p => p.id === projectId ? { ...p, name, updatedAt: Date.now() } : p),
        updatedAt: Date.now(),
      };
    });
    setSystems(newSystems);

    // Save to appropriate adapter
    const system = newSystems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to update project in filesystem:', err)
      );
    }
  };

  const deleteProject = (systemId: string, projectId: string) => {
    const newSystems = systems.map(s => {
      if (s.id !== systemId) return s;
      return {
        ...s,
        projects: s.projects.filter(p => p.id !== projectId),
        updatedAt: Date.now(),
      };
    });
    const newNotes = notes.filter(n => !(n.systemId === systemId && n.projectId === projectId));
    setSystems(newSystems);
    // Also delete all notes in this project
    setNotes(newNotes);

    // Save to appropriate adapter
    if (isFilesystem) {
      filesystemAdapter.deleteProject(systemId, projectId).catch(err =>
        console.error('[NotesStore] Failed to delete project from filesystem:', err)
      );
    }
  };

  const updateProjectMetadata = (systemId: string, projectId: string, updates: Partial<Omit<Project, "id">>) => {
    const newSystems = systems.map(s => {
      if (s.id !== systemId) return s;
      return {
        ...s,
        projects: s.projects.map(p => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            ...updates,
            updatedAt: Date.now(),
          };
        }),
        updatedAt: Date.now(),
      };
    });
    setSystems(newSystems);

    // Save to appropriate adapter
    const system = newSystems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to update project metadata in filesystem:', err)
      );
    }
  };

  const getProject = (systemId: string, projectId: string): Project | undefined => {
    const system = systems.find(s => s.id === systemId);
    return system?.projects.find(p => p.id === projectId);
  };

  // Note operations
  const addNote = (systemId: string, projectId: string, editorType: EditorType): Note => {
    const now = Date.now();
    let defaultContent: Block[] | string | VisualNode[];

    switch (editorType) {
      case "standard":
        defaultContent = "# New Note\n\nStart writing here...";
        break;
      case "visual":
        defaultContent = [
          { id: generateId(), type: "start", label: "Start", x: 200, y: 100 },
        ];
        break;
      case "modular":
      default:
        defaultContent = [
          { id: generateId(), type: "heading", content: "New Note", metadata: { level: 1 } },
          { id: generateId(), type: "paragraph", content: "Start writing here..." },
        ];
        break;
    }

    const newNote: Note = {
      id: generateId(),
      title: "New Note",
      preview: "Start writing here...",
      date: formatDate(),
      tags: [],
      systemId,
      projectId,
      editorType,
      content: defaultContent,
      createdAt: now,
      updatedAt: now,
    };
    const newNotes = [newNote, ...notes];
    setNotes(newNotes);

    // Save to appropriate adapter
    if (isFilesystem) {
      filesystemAdapter.saveNote(newNote).catch(err =>
        console.error('[NotesStore] Failed to save note to filesystem:', err)
      );
    }

    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Omit<Note, "id">>) => {
    const newNotes = notes.map(n => {
      if (n.id !== id) return n;
      return {
        ...n,
        ...updates,
        updatedAt: Date.now(),
      };
    });
    setNotes(newNotes);

    // Save to appropriate adapter
    const updatedNote = newNotes.find(n => n.id === id);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to update note in filesystem:', err)
      );
    }
  };

  const saveAttachment = (noteId: string, filename: string, dataUrl: string) => {
    // Use functional update to avoid stale closure
    setNotes(prevNotes => {
      const newNotes = prevNotes.map(n => {
        if (n.id !== noteId) return n;

        return {
          ...n,
          attachments: {
            ...(n.attachments || {}),
            [filename]: dataUrl,
          },
          updatedAt: Date.now(),
        };
      });

      return newNotes;
    });

    // Also save to filesystem if in filesystem mode
    if (isFilesystem) {
      filesystemAdapter.saveAttachment(noteId, filename, dataUrl).catch(err =>
        console.error('[NotesStore] Failed to save attachment to filesystem:', err)
      );
    }
  };

  const updateNoteContent = (id: string, content: Block[] | string | VisualNode[]) => {
    const newNotes = notes.map(n => {
      if (n.id !== id) return n;

      // Extract title and preview based on content type
      let title = n.title;
      let preview = n.preview;

      if (typeof content === "string") {
        // For markdown: extract first heading (# Title)
        const headingMatch = content.match(/^#\s+(.+)$/m);
        if (headingMatch) {
          title = headingMatch[1].trim();
        }
        // Preview: strip markdown headings, take first 100 chars
        preview = content.replace(/^#+\s+/gm, "").slice(0, 100).trim();
      } else if (Array.isArray(content) && content.length > 0) {
        const firstItem = content[0] as any;

        // Block content (has 'type' like heading, paragraph, etc.)
        if (firstItem.type && ["heading", "paragraph", "code", "list", "image", "section"].includes(firstItem.type)) {
          // Find first heading for title
          const headingBlock = (content as Block[]).find(b => b.type === "heading");
          if (headingBlock && headingBlock.content) {
            title = headingBlock.content.trim();
          }
          // Preview from first content block
          const contentBlock = (content as Block[]).find(b => b.content && b.type !== "section");
          if (contentBlock) {
            preview = contentBlock.content.slice(0, 100).trim();
          }
        }
        // Visual nodes (has 'type' like start, process, etc.)
        else if (firstItem.type && ["start", "process", "decision", "end"].includes(firstItem.type)) {
          // Use first node's label as title if it's meaningful
          if (firstItem.label && firstItem.label !== "Start") {
            title = firstItem.label;
          }
          preview = `Flowchart with ${content.length} nodes`;
        }
      }

      return {
        ...n,
        title,
        content,
        preview,
        date: "Just now",
        updatedAt: Date.now(),
      };
    });
    setNotes(newNotes);

    // Save to appropriate adapter
    const updatedNote = newNotes.find(n => n.id === id);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to update note content in filesystem:', err)
      );
    }

    // Sync auto-extracted tags and links from content
    syncAutoExtractedData(id);
  };

  const deleteNote = (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (noteToDelete) {
      const newTrash = [noteToDelete, ...trash];
      const newNotes = notes.filter(n => n.id !== id);
      setTrash(newTrash);
      setNotes(newNotes);

      // Save to appropriate adapter
      if (isFilesystem) {
        filesystemAdapter.deleteNote(id).catch(err =>
          console.error('[NotesStore] Failed to delete note from filesystem:', err)
        );
      }
    }
  };

  const restoreNote = (id: string) => {
    const noteToRestore = trash.find(n => n.id === id);
    if (noteToRestore) {
      const newNotes = [noteToRestore, ...notes];
      const newTrash = trash.filter(n => n.id !== id);
      setNotes(newNotes);
      setTrash(newTrash);

      // Save to appropriate adapter
      if (isFilesystem) {
        filesystemAdapter.restoreNote(id).catch(err =>
          console.error('[NotesStore] Failed to restore note from filesystem:', err)
        );
      }
    }
  };

  const permanentlyDeleteNote = (id: string) => {
    const newTrash = trash.filter(n => n.id !== id);
    setTrash(newTrash);

    // Save to appropriate adapter
    if (isFilesystem) {
      filesystemAdapter.permanentlyDeleteNote(id).catch(err =>
        console.error('[NotesStore] Failed to permanently delete note from filesystem:', err)
      );
    }
  };

  const emptyTrash = () => {
    setTrash([]);

    // Save to appropriate adapter
    if (isFilesystem) {
      filesystemAdapter.emptyTrash().catch(err =>
        console.error('[NotesStore] Failed to empty trash in filesystem:', err)
      );
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

  // Extract hashtags from note content
  const extractTagsFromContent = (noteId: string): string[] => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return [];

    let content = '';
    if (typeof note.content === 'string') {
      content = note.content;
    } else if (Array.isArray(note.content)) {
      // Extract from blocks
      const first = note.content[0] as any;
      if (first?.type && ["heading", "paragraph", "code", "list", "image", "section"].includes(first.type)) {
        content = (note.content as Block[]).map(b => b.content || '').join(' ');
      }
    }

    // Match #tagname patterns (alphanumeric and underscores)
    const matches = content.match(/#(\w+)/g) || [];
    return [...new Set(matches.map(m => m.slice(1)))]; // Remove # prefix and deduplicate
  };

  // Sync auto-extracted tags and links from content to note metadata
  const syncAutoExtractedData = (noteId: string) => {
    setNotes(prevNotes => {
      const note = prevNotes.find(n => n.id === noteId);
      if (!note) return prevNotes;

      // Extract tags from content
      const extractedTags = extractTagsFromContent(noteId);
      const existingTags = note.tags || [];
      const allTags = [...new Set([...existingTags, ...extractedTags])];

      // Extract links from content (http/https URLs)
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

      // Update note if there are new tags or links
      const newLinks = autoExtractedUrls.map(url => {
        // Normalize www. URLs to https://
        const normalizedUrl = url.startsWith('www.') ? `https://${url}` : url;
        return {
          id: `link_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          url: normalizedUrl,
          title: url.split('/').pop() || url,
          addedAt: Date.now(),
        };
      });

      if (allTags.length > existingTags.length || newLinks.length > 0) {
        const updatedNote = {
          ...note,
          tags: allTags,
          links: [...existingLinks, ...newLinks],
          updatedAt: Date.now(),
        };

        // Save to filesystem after state update
        if (isFilesystem) {
          filesystemAdapter.saveNote(updatedNote).catch(err =>
            console.error('[NotesStore] Failed to sync auto-extracted data in filesystem:', err)
          );
        }

        return prevNotes.map(n => n.id !== noteId ? n : updatedNote);
      }

      return prevNotes;
    });
  };

  // Get aggregated tags from all items at a level
  const getAggregatedTags = (level: 'project' | 'system' | 'root', id?: string): string[] => {
    const allTags: string[] = [];

    switch (level) {
      case 'project': {
        if (!id) return [];
        const projectNotes = notes.filter(n => n.projectId === id);
        projectNotes.forEach(note => {
          allTags.push(...(note.tags || []));
          allTags.push(...extractTagsFromContent(note.id));
        });
        break;
      }
      case 'system': {
        if (!id) return [];
        const systemNotes = notes.filter(n => n.systemId === id);
        systemNotes.forEach(note => {
          allTags.push(...(note.tags || []));
          allTags.push(...extractTagsFromContent(note.id));
        });
        // Also include project tags
        const system = systems.find(s => s.id === id);
        system?.projects.forEach(p => {
          allTags.push(...(p.tags || []));
        });
        break;
      }
      case 'root': {
        notes.forEach(note => {
          allTags.push(...(note.tags || []));
          allTags.push(...extractTagsFromContent(note.id));
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

  // Get metrics stats (counts of good/warning/critical) from items at a level
  const getMetricsStats = (level: 'project' | 'system' | 'root', id?: string): { good: number; warning: number; critical: number } => {
    const stats = { good: 0, warning: 0, critical: 0 };

    switch (level) {
      case 'project': {
        if (!id) return stats;
        // Count from notes in project
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
        // Count from notes in system
        const systemNotes = notes.filter(n => n.systemId === id);
        systemNotes.forEach(note => {
          if (note.metrics?.health === 'good') stats.good++;
          else if (note.metrics?.health === 'warning') stats.warning++;
          else if (note.metrics?.health === 'critical') stats.critical++;
        });
        // Count from projects in system
        const system = systems.find(s => s.id === id);
        system?.projects.forEach(p => {
          if (p.metrics?.health === 'good') stats.good++;
          else if (p.metrics?.health === 'warning') stats.warning++;
          else if (p.metrics?.health === 'critical') stats.critical++;
        });
        break;
      }
      case 'root': {
        // Count from all notes
        notes.forEach(note => {
          if (note.metrics?.health === 'good') stats.good++;
          else if (note.metrics?.health === 'warning') stats.warning++;
          else if (note.metrics?.health === 'critical') stats.critical++;
        });
        // Count from all projects
        systems.forEach(system => {
          system.projects.forEach(p => {
            if (p.metrics?.health === 'good') stats.good++;
            else if (p.metrics?.health === 'warning') stats.warning++;
            else if (p.metrics?.health === 'critical') stats.critical++;
          });
        });
        // Count from all systems
        systems.forEach(s => {
          if (s.metrics?.health === 'good') stats.good++;
          else if (s.metrics?.health === 'warning') stats.warning++;
          else if (s.metrics?.health === 'critical') stats.critical++;
        });
        break;
      }
    }

    return stats;
  };

  // Update tag color for a note
  const updateNoteTagColor = (noteId: string, tagName: string, color: string) => {
    const newNotes = notes.map(n => {
      if (n.id !== noteId) return n;
      return {
        ...n,
        tagColors: {
          ...n.tagColors,
          [tagName]: color,
        },
        updatedAt: Date.now(),
      };
    });
    setNotes(newNotes);

    const updatedNote = newNotes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to update note tag color in filesystem:', err)
      );
    }
  };

  // Update tag color for a project
  const updateProjectTagColor = (systemId: string, projectId: string, tagName: string, color: string) => {
    const newSystems = systems.map(s => {
      if (s.id !== systemId) return s;
      return {
        ...s,
        projects: s.projects.map(p => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            tagColors: {
              ...p.tagColors,
              [tagName]: color,
            },
            updatedAt: Date.now(),
          };
        }),
        updatedAt: Date.now(),
      };
    });
    setSystems(newSystems);

    const system = newSystems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to update project tag color in filesystem:', err)
      );
    }
  };

  // Update tag color for a system
  const updateSystemTagColor = (systemId: string, tagName: string, color: string) => {
    const newSystems = systems.map(s => {
      if (s.id !== systemId) return s;
      return {
        ...s,
        tagColors: {
          ...s.tagColors,
          [tagName]: color,
        },
        updatedAt: Date.now(),
      };
    });
    setSystems(newSystems);

    const updatedSystem = newSystems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to update system tag color in filesystem:', err)
      );
    }
  };

  // Update metrics for a note
  const updateNoteMetrics = (noteId: string, metrics: Partial<ItemMetrics>) => {
    setNotes(notes.map(n => {
      if (n.id !== noteId) return n;
      return {
        ...n,
        metrics: {
          ...n.metrics,
          ...metrics,
        },
        updatedAt: Date.now(),
      };
    }));

    const updatedNote = notes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote({ ...updatedNote, metrics: { ...updatedNote.metrics, ...metrics } }).catch(err =>
        console.error('[NotesStore] Failed to update note metrics in filesystem:', err)
      );
    }
  };

  // Update metrics for a project
  const updateProjectMetrics = (systemId: string, projectId: string, metrics: Partial<ItemMetrics>) => {
    setSystems(systems.map(s => {
      if (s.id !== systemId) return s;
      return {
        ...s,
        projects: s.projects.map(p => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            metrics: {
              ...p.metrics,
              ...metrics,
            },
            updatedAt: Date.now(),
          };
        }),
      };
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, { ...updatedProject, metrics: { ...updatedProject.metrics, ...metrics } }).catch(err =>
        console.error('[NotesStore] Failed to update project metrics in filesystem:', err)
      );
    }
  };

  // Update metrics for a system
  const updateSystemMetrics = (systemId: string, metrics: Partial<ItemMetrics>) => {
    setSystems(systems.map(s => {
      if (s.id !== systemId) return s;
      return {
        ...s,
        metrics: {
          ...s.metrics,
          ...metrics,
        },
        updatedAt: Date.now(),
      };
    }));

    const updatedSystem = systems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem({ ...updatedSystem, metrics: { ...updatedSystem.metrics, ...metrics } }).catch(err =>
        console.error('[NotesStore] Failed to update system metrics in filesystem:', err)
      );
    }
  };

  // Update color/icon for a system
  const updateSystemColorIcon = (id: string, color?: string, icon?: string) => {
    setSystems(systems.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        updatedAt: Date.now(),
      };
    }));

    const updatedSystem = systems.find(s => s.id === id);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem({ ...updatedSystem, color: color ?? updatedSystem.color, icon: icon ?? updatedSystem.icon }).catch(err =>
        console.error('[NotesStore] Failed to update system color/icon in filesystem:', err)
      );
    }
  };

  // Update color/icon for a project
  const updateProjectColorIcon = (systemId: string, projectId: string, color?: string, icon?: string) => {
    setSystems(systems.map(s => {
      if (s.id !== systemId) return s;
      return {
        ...s,
        projects: s.projects.map(p => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            ...(color !== undefined && { color }),
            ...(icon !== undefined && { icon }),
            updatedAt: Date.now(),
          };
        }),
      };
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, { ...updatedProject, color: color ?? updatedProject.color, icon: icon ?? updatedProject.icon }).catch(err =>
        console.error('[NotesStore] Failed to update project color/icon in filesystem:', err)
      );
    }
  };

  // Add attachment to a system
  const addSystemAttachment = (systemId: string, attachment: Omit<Attachment, 'id' | 'createdAt'>) => {
    const newAttachment: Attachment = {
      ...attachment,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setSystems(systems.map(s => {
      if (s.id !== systemId) return s;
      return {
        ...s,
        attachments: [...(s.attachments || []), newAttachment],
        updatedAt: Date.now(),
      };
    }));

    const updatedSystem = systems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to add system attachment in filesystem:', err)
      );
    }
  };

  // Remove attachment from a system
  const removeSystemAttachment = (systemId: string, attachmentId: string) => {
    setSystems(systems.map(s => {
      if (s.id !== systemId) return s;
      return {
        ...s,
        attachments: (s.attachments || []).filter(a => a.id !== attachmentId),
        updatedAt: Date.now(),
      };
    }));

    const updatedSystem = systems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to remove system attachment in filesystem:', err)
      );
    }
  };

  // Add attachment to a project
  const addProjectAttachment = (systemId: string, projectId: string, attachment: Omit<Attachment, 'id' | 'createdAt'>) => {
    const newAttachment: Attachment = {
      ...attachment,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setSystems(systems.map(s => {
      if (s.id !== systemId) return s;
      return {
        ...s,
        projects: s.projects.map(p => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            attachments: [...(p.attachments || []), newAttachment],
            updatedAt: Date.now(),
          };
        }),
      };
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to add project attachment in filesystem:', err)
      );
    }
  };

  // Remove attachment from a project
  const removeProjectAttachment = (systemId: string, projectId: string, attachmentId: string) => {
    setSystems(systems.map(s => {
      if (s.id !== systemId) return s;
      return {
        ...s,
        projects: s.projects.map(p => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            attachments: (p.attachments || []).filter(a => a.id !== attachmentId),
            updatedAt: Date.now(),
          };
        }),
      };
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to remove project attachment in filesystem:', err)
      );
    }
  };

  // Photo operations
  const addSystemPhoto = (systemId: string, name: string, dataUrl: string) => {
    const newPhoto: Photo = { id: crypto.randomUUID(), name, dataUrl, addedAt: Date.now() };
    setSystems(systems.map(s => s.id !== systemId ? s : { ...s, photos: [...(s.photos || []), newPhoto], updatedAt: Date.now() }));

    const updatedSystem = systems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to add system photo in filesystem:', err)
      );
    }
  };

  const removeSystemPhoto = (systemId: string, photoId: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : { ...s, photos: (s.photos || []).filter(p => p.id !== photoId), updatedAt: Date.now() }));

    const updatedSystem = systems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to remove system photo in filesystem:', err)
      );
    }
  };

  const addProjectPhoto = (systemId: string, projectId: string, name: string, dataUrl: string) => {
    const newPhoto: Photo = { id: crypto.randomUUID(), name, dataUrl, addedAt: Date.now() };
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : { ...p, photos: [...(p.photos || []), newPhoto], updatedAt: Date.now() }),
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to add project photo in filesystem:', err)
      );
    }
  };

  const removeProjectPhoto = (systemId: string, projectId: string, photoId: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : { ...p, photos: (p.photos || []).filter(ph => ph.id !== photoId), updatedAt: Date.now() }),
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to remove project photo in filesystem:', err)
      );
    }
  };

  // Voice recording operations
  const addSystemVoiceRecording = (systemId: string, name: string, dataUrl: string, duration?: string) => {
    const newRec: VoiceRecording = { id: crypto.randomUUID(), name, dataUrl, duration, addedAt: Date.now() };
    setSystems(systems.map(s => s.id !== systemId ? s : { ...s, voiceRecordings: [...(s.voiceRecordings || []), newRec], updatedAt: Date.now() }));

    const updatedSystem = systems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to add system voice recording in filesystem:', err)
      );
    }
  };

  const removeSystemVoiceRecording = (systemId: string, recordingId: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : { ...s, voiceRecordings: (s.voiceRecordings || []).filter(r => r.id !== recordingId), updatedAt: Date.now() }));

    const updatedSystem = systems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to remove system voice recording in filesystem:', err)
      );
    }
  };

  const addProjectVoiceRecording = (systemId: string, projectId: string, name: string, dataUrl: string, duration?: string) => {
    const newRec: VoiceRecording = { id: crypto.randomUUID(), name, dataUrl, duration, addedAt: Date.now() };
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : { ...p, voiceRecordings: [...(p.voiceRecordings || []), newRec], updatedAt: Date.now() }),
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to add project voice recording in filesystem:', err)
      );
    }
  };

  const removeProjectVoiceRecording = (systemId: string, projectId: string, recordingId: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : { ...p, voiceRecordings: (p.voiceRecordings || []).filter(r => r.id !== recordingId), updatedAt: Date.now() }),
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to remove project voice recording in filesystem:', err)
      );
    }
  };

  // Link operations
  const addSystemLink = (systemId: string, url: string, title?: string) => {
    const newLink: SavedLink = { id: crypto.randomUUID(), url, title, addedAt: Date.now() };
    setSystems(systems.map(s => s.id !== systemId ? s : { ...s, links: [...(s.links || []), newLink], updatedAt: Date.now() }));

    const updatedSystem = systems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to add system link in filesystem:', err)
      );
    }
  };

  const removeSystemLink = (systemId: string, linkId: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : { ...s, links: (s.links || []).filter(l => l.id !== linkId), updatedAt: Date.now() }));

    const updatedSystem = systems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to remove system link in filesystem:', err)
      );
    }
  };

  const updateSystemLink = (systemId: string, linkId: string, updates: Partial<SavedLink>) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      links: (s.links || []).map(l => l.id !== linkId ? l : { ...l, ...updates }),
      updatedAt: Date.now(),
    }));

    const updatedSystem = systems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to update system link in filesystem:', err)
      );
    }
  };

  const addProjectLink = (systemId: string, projectId: string, url: string, title?: string) => {
    const newLink: SavedLink = { id: crypto.randomUUID(), url, title, addedAt: Date.now() };
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : { ...p, links: [...(p.links || []), newLink], updatedAt: Date.now() }),
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to add project link in filesystem:', err)
      );
    }
  };

  const removeProjectLink = (systemId: string, projectId: string, linkId: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : { ...p, links: (p.links || []).filter(l => l.id !== linkId), updatedAt: Date.now() }),
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to remove project link in filesystem:', err)
      );
    }
  };

  const updateProjectLink = (systemId: string, projectId: string, linkId: string, updates: Partial<SavedLink>) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : {
        ...p,
        links: (p.links || []).map(l => l.id !== linkId ? l : { ...l, ...updates }),
        updatedAt: Date.now(),
      }),
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to update project link in filesystem:', err)
      );
    }
  };

  // Detail notes operations
  const updateSystemDetailNotes = (systemId: string, notes: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : { ...s, detailNotes: notes, updatedAt: Date.now() }));

    const updatedSystem = systems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to update system detail notes in filesystem:', err)
      );
    }
  };

  const updateProjectDetailNotes = (systemId: string, projectId: string, notes: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : { ...p, detailNotes: notes, updatedAt: Date.now() }),
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to update project detail notes in filesystem:', err)
      );
    }
  };

  // Tag operations for system/project
  const addSystemTag = (systemId: string, tag: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      tags: [...new Set([...(s.tags || []), tag.toLowerCase()])],
      updatedAt: Date.now(),
    }));

    const updatedSystem = systems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to add system tag in filesystem:', err)
      );
    }
  };

  const removeSystemTag = (systemId: string, tag: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      tags: (s.tags || []).filter(t => t !== tag),
      updatedAt: Date.now(),
    }));

    const updatedSystem = systems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to remove system tag in filesystem:', err)
      );
    }
  };

  const addProjectTag = (systemId: string, projectId: string, tag: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : {
        ...p,
        tags: [...new Set([...(p.tags || []), tag.toLowerCase()])],
        updatedAt: Date.now(),
      }),
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to add project tag in filesystem:', err)
      );
    }
  };

  const removeProjectTag = (systemId: string, projectId: string, tag: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : {
        ...p,
        tags: (p.tags || []).filter(t => t !== tag),
        updatedAt: Date.now(),
      }),
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to remove project tag in filesystem:', err)
      );
    }
  };

  // System contacts operations
  const addSystemContact = (systemId: string, contact: Omit<Contact, "id">) => {
    const newContact: Contact = { id: crypto.randomUUID(), ...contact };
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      contacts: [...(s.contacts || []), newContact],
      updatedAt: Date.now(),
    }));

    const updatedSystem = systems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to add system contact in filesystem:', err)
      );
    }
  };

  const removeSystemContact = (systemId: string, contactId: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      contacts: (s.contacts || []).filter(c => c.id !== contactId),
      updatedAt: Date.now(),
    }));

    const updatedSystem = systems.find(s => s.id === systemId);
    if (isFilesystem && updatedSystem) {
      filesystemAdapter.saveSystem(updatedSystem).catch(err =>
        console.error('[NotesStore] Failed to remove system contact in filesystem:', err)
      );
    }
  };

  // Project contacts operations
  const addProjectContact = (systemId: string, projectId: string, contact: Omit<Contact, "id">) => {
    const newContact: Contact = { id: crypto.randomUUID(), ...contact };
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : {
        ...p,
        contacts: [...(p.contacts || []), newContact],
        updatedAt: Date.now(),
      }),
      updatedAt: Date.now(),
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to add project contact in filesystem:', err)
      );
    }
  };

  const removeProjectContact = (systemId: string, projectId: string, contactId: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : {
        ...p,
        contacts: (p.contacts || []).filter(c => c.id !== contactId),
        updatedAt: Date.now(),
      }),
      updatedAt: Date.now(),
    }));

    const system = systems.find(s => s.id === systemId);
    const updatedProject = system?.projects.find(p => p.id === projectId);
    if (isFilesystem && updatedProject) {
      filesystemAdapter.saveProject(systemId, updatedProject).catch(err =>
        console.error('[NotesStore] Failed to remove project contact in filesystem:', err)
      );
    }
  };

  // Note-specific operations
  const addNotePhoto = (noteId: string, name: string, dataUrl: string) => {
    const newPhoto: Photo = { id: crypto.randomUUID(), name, dataUrl, addedAt: Date.now() };

    // Update React state
    setNotes(prevNotes => {
      return prevNotes.map(n => {
        if (n.id !== noteId) return n;
        const updatedNote = { ...n, photos: [...(n.photos || []), newPhoto], updatedAt: Date.now() };

        // Save to filesystem after state update
        if (isFilesystem) {
          filesystemAdapter.saveAttachment(noteId, name, dataUrl).catch(err =>
            console.error('[NotesStore] Failed to save photo attachment to filesystem:', err)
          );
          filesystemAdapter.saveNote(updatedNote).catch(err =>
            console.error('[NotesStore] Failed to save note with photo in filesystem:', err)
          );
        }

        return updatedNote;
      });
    });
  };

  const removeNotePhoto = (noteId: string, photoId: string) => {
    setNotes(notes.map(n => n.id !== noteId ? n : { ...n, photos: (n.photos || []).filter(p => p.id !== photoId), updatedAt: Date.now() }));

    const updatedNote = notes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to remove note photo in filesystem:', err)
      );
    }
  };

  const addNoteVoiceRecording = (noteId: string, name: string, dataUrl: string, duration?: string) => {
    const newRec: VoiceRecording = { id: crypto.randomUUID(), name, dataUrl, duration, addedAt: Date.now() };
    setNotes(notes.map(n => n.id !== noteId ? n : { ...n, voiceRecordings: [...(n.voiceRecordings || []), newRec], updatedAt: Date.now() }));

    const updatedNote = notes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to add note voice recording in filesystem:', err)
      );
    }
  };

  const removeNoteVoiceRecording = (noteId: string, recordingId: string) => {
    setNotes(notes.map(n => n.id !== noteId ? n : { ...n, voiceRecordings: (n.voiceRecordings || []).filter(r => r.id !== recordingId), updatedAt: Date.now() }));

    const updatedNote = notes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to remove note voice recording in filesystem:', err)
      );
    }
  };

  const addNoteLink = (noteId: string, url: string, title?: string) => {
    const newLink: SavedLink = { id: crypto.randomUUID(), url, title, addedAt: Date.now() };
    setNotes(notes.map(n => n.id !== noteId ? n : { ...n, links: [...(n.links || []), newLink], updatedAt: Date.now() }));

    const updatedNote = notes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to add note link in filesystem:', err)
      );
    }
  };

  const removeNoteLink = (noteId: string, linkId: string) => {
    setNotes(notes.map(n => n.id !== noteId ? n : { ...n, links: (n.links || []).filter(l => l.id !== linkId), updatedAt: Date.now() }));

    const updatedNote = notes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to remove note link in filesystem:', err)
      );
    }
  };

  const updateNoteLink = (noteId: string, linkId: string, updates: Partial<SavedLink>) => {
    setNotes(notes.map(n => n.id !== noteId ? n : {
      ...n,
      links: (n.links || []).map(l => l.id !== linkId ? l : { ...l, ...updates }),
      updatedAt: Date.now(),
    }));

    const updatedNote = notes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to update note link in filesystem:', err)
      );
    }
  };

  const addNoteTag = (noteId: string, tag: string) => {
    setNotes(notes.map(n => n.id !== noteId ? n : {
      ...n,
      tags: [...new Set([...(n.tags || []), tag.toLowerCase()])],
      updatedAt: Date.now(),
    }));

    const updatedNote = notes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to add note tag in filesystem:', err)
      );
    }
  };

  const removeNoteTag = (noteId: string, tag: string) => {
    setNotes(notes.map(n => n.id !== noteId ? n : {
      ...n,
      tags: (n.tags || []).filter(t => t !== tag),
      updatedAt: Date.now(),
    }));

    const updatedNote = notes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to remove note tag in filesystem:', err)
      );
    }
  };

  const renameNoteTag = (noteId: string, oldTag: string, newTag: string) => {
    setNotes(notes.map(n => {
      if (n.id !== noteId) return n;
      const tags = (n.tags || []).map(t => t === oldTag ? newTag.toLowerCase() : t);
      const tagColors = n.tagColors ? { ...n.tagColors } : {};
      if (tagColors[oldTag]) {
        tagColors[newTag.toLowerCase()] = tagColors[oldTag];
        delete tagColors[oldTag];
      }
      return { ...n, tags: [...new Set(tags)], tagColors, updatedAt: Date.now() };
    }));

    const updatedNote = notes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to rename note tag in filesystem:', err)
      );
    }
  };

  const updateNoteCustomType = (noteId: string, customType: string) => {
    setNotes(notes.map(n => n.id !== noteId ? n : { ...n, customType: customType || undefined, updatedAt: Date.now() }));

    const updatedNote = notes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to update note custom type in filesystem:', err)
      );
    }
  };

  const updateNoteDetailNotes = (noteId: string, detailNotes: string) => {
    setNotes(notes.map(n => n.id !== noteId ? n : { ...n, detailNotes, updatedAt: Date.now() }));

    const updatedNote = notes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to update note detail notes in filesystem:', err)
      );
    }
  };

  // Contact operations for notes
  const addNoteContact = (noteId: string, contact: Omit<Contact, "id">) => {
    const newContact: Contact = { ...contact, id: crypto.randomUUID() };
    setNotes(notes.map(n => n.id !== noteId ? n : {
      ...n,
      contacts: [...(n.contacts || []), newContact],
      updatedAt: Date.now(),
    }));

    const updatedNote = notes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to add note contact in filesystem:', err)
      );
    }
  };

  const removeNoteContact = (noteId: string, contactId: string) => {
    setNotes(notes.map(n => n.id !== noteId ? n : {
      ...n,
      contacts: (n.contacts || []).filter(c => c.id !== contactId),
      updatedAt: Date.now(),
    }));

    const updatedNote = notes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to remove note contact in filesystem:', err)
      );
    }
  };

  const updateNoteContact = (noteId: string, contactId: string, updates: Partial<Contact>) => {
    setNotes(notes.map(n => n.id !== noteId ? n : {
      ...n,
      contacts: (n.contacts || []).map(c => c.id !== contactId ? c : { ...c, ...updates }),
      updatedAt: Date.now(),
    }));

    const updatedNote = notes.find(n => n.id === noteId);
    if (isFilesystem && updatedNote) {
      filesystemAdapter.saveNote(updatedNote).catch(err =>
        console.error('[NotesStore] Failed to update note contact in filesystem:', err)
      );
    }
  };

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
