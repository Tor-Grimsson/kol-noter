import { createContext, useContext, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// Types
export type EditorType = "standard" | "modular" | "visual";

export type HealthStatus = 'good' | 'warning' | 'critical';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type ItemStatus = 'not_started' | 'in_progress' | 'done' | 'blocked';

export interface ItemMetrics {
  health?: HealthStatus;
  priority?: PriorityLevel;
  lead?: string;
  targetDate?: string;
  status?: ItemStatus;
}

export interface TagWithColor {
  name: string;
  color: string;
}

// Primary color palette for tags and notes
export const TAG_COLOR_PRESETS = [
  { name: 'blue', value: '#49a0a2' },
  { name: 'green', value: '#66a44c' },
  { name: 'yellow', value: '#ffe32e' },
  { name: 'red', value: '#ce4646' },
  { name: 'orange', value: '#db8000' },
  { name: 'purple', value: '#9437ff' },
  { name: 'warm', value: '#d0d79d' },
  { name: 'dark', value: '#121215' },
];

// Alias for backward compatibility
export const EXPLORER_COLORS = TAG_COLOR_PRESETS;

// Inverse colors for light text on colored backgrounds
export const TAG_COLOR_INVERSES: Record<string, string> = {
  '#49a0a2': '#000000',  // blue
  '#66a44c': '#000000',  // green
  '#ffe32e': '#000000',  // yellow
  '#ce4646': '#ffffff',  // red
  '#db8000': '#000000',  // orange
  '#9437ff': '#ffffff',  // purple
  '#d0d79d': '#000000',  // warm
  '#121215': '#ffffff',  // dark
};

export const EXPLORER_ICONS = ["folder", "star", "heart", "code", "book", "briefcase", "home", "music"];

export interface Block {
  id: string;
  type: "heading" | "paragraph" | "code" | "list" | "image" | "section";
  content: string;
  metadata?: {
    level?: number;
    language?: string;
    listType?: "bullet" | "numbered";
    columns?: 1 | 2;
  };
}

export interface VisualNode {
  id: string;
  type: "start" | "process" | "decision" | "end";
  label: string;
  x: number;
  y: number;
  connections?: string[];
}

export interface Reminder {
  date: string;
  text: string;
}

export interface Attachment {
  id: string;
  type: 'image' | 'file' | 'link';
  url: string;  // data URL for uploads, external URL for links
  name: string;
  createdAt: number;
  size?: number;
  mimeType?: string;
}

export interface Photo {
  id: string;
  name: string;
  dataUrl: string;
  addedAt: number;
}

export interface VoiceRecording {
  id: string;
  name: string;
  dataUrl: string;
  duration?: string;
  addedAt: number;
}

export interface SavedLink {
  id: string;
  url: string;
  title?: string;
  autoExtracted?: boolean;
  addedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  tagColors?: { [tagName: string]: string };
  attachments?: Attachment[];
  photos?: Photo[];
  voiceRecordings?: VoiceRecording[];
  links?: SavedLink[];
  detailNotes?: string;
  mentions?: string[]; // IDs of linked items
  reminders?: Reminder[];
  metrics?: ItemMetrics;
  color?: string;
  icon?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface System {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  tagColors?: { [tagName: string]: string };
  attachments?: Attachment[];
  photos?: Photo[];
  voiceRecordings?: VoiceRecording[];
  links?: SavedLink[];
  detailNotes?: string;
  mentions?: string[]; // IDs of linked items
  reminders?: Reminder[];
  metrics?: ItemMetrics;
  color?: string;
  icon?: string;
  createdAt?: number;
  updatedAt?: number;
  projects: Project[];
}

export interface Note {
  id: string;
  title: string;
  preview: string;
  date: string;
  tags: string[];
  tagColors?: { [tagName: string]: string };
  favorite?: boolean;
  color?: string;
  /** Custom icon to display on card, null = hidden, string = icon name */
  icon?: string | null;
  systemId: string;
  projectId: string;
  editorType: EditorType;
  content: Block[] | string | VisualNode[];
  attachments?: {
    [filename: string]: string; // filename -> base64 data URL
  };
  metrics?: ItemMetrics;
  createdAt: number;
  updatedAt: number;
}

interface NotesStore {
  systems: System[];
  notes: Note[];
  trash: Note[];
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
  getAggregatedTags: (level: 'project' | 'system' | 'root', id?: string) => string[];
  updateNoteTagColor: (noteId: string, tagName: string, color: string) => void;
  updateProjectTagColor: (systemId: string, projectId: string, tagName: string, color: string) => void;
  updateSystemTagColor: (systemId: string, tagName: string, color: string) => void;
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
}

// Default data
const defaultSystems: System[] = [
  {
    id: "system-1",
    name: "Work",
    projects: [
      { id: "project-1", name: "Engineering" },
      { id: "project-2", name: "Product" },
    ],
  },
  {
    id: "system-2",
    name: "Personal",
    projects: [
      { id: "project-3", name: "Learning" },
    ],
  },
];

const defaultBlocks: Block[] = [
  {
    id: "1",
    type: "heading",
    content: "New Note",
    metadata: { level: 1 },
  },
  {
    id: "2",
    type: "paragraph",
    content: "Start writing here...",
  },
];

const defaultNotes: Note[] = [
  {
    id: "1",
    title: "Project Tasks Summary",
    preview: "This document outlines the refactoring and animation tasks discussed...",
    date: "2 mins ago",
    tags: ["work", "urgent"],
    favorite: true,
    color: "warning",
    systemId: "system-1",
    projectId: "project-1",
    editorType: "modular",
    content: [
      { id: "1", type: "heading", content: "Project Tasks Summary", metadata: { level: 1 } },
      { id: "2", type: "paragraph", content: "This document outlines the refactoring and animation tasks discussed." },
      { id: "3", type: "section", content: "Completed Tasks" },
      { id: "4", type: "heading", content: "Task 1: Deprecate Custom Design System", metadata: { level: 2 } },
      { id: "5", type: "paragraph", content: "The initial task was to refactor the entire frontend to remove the custom CSS utility classes defined in index.css." },
    ],
    createdAt: Date.now() - 120000,
    updatedAt: Date.now() - 120000,
  },
  {
    id: "2",
    title: "Router Config",
    preview: "Configuration for routing system and navigation patterns...",
    date: "10 mins ago",
    tags: ["config"],
    color: "accent",
    systemId: "system-1",
    projectId: "project-1",
    editorType: "standard",
    content: "# Router Config\n\nConfiguration for routing system and navigation patterns.\n\n## Routes\n\n- `/` - Home\n- `/projects` - Projects view\n- `/hierarchy` - Hierarchy view",
    createdAt: Date.now() - 600000,
    updatedAt: Date.now() - 600000,
  },
  {
    id: "FAD",
    title: "FAD",
    preview: "Frequently accessed data and personal notes...",
    date: "30 mins ago",
    tags: ["personal"],
    favorite: true,
    color: "primary",
    systemId: "system-2",
    projectId: "project-3",
    editorType: "visual",
    content: [
      { id: "node-1", type: "start", label: "Start", x: 100, y: 100 },
      { id: "node-2", type: "process", label: "Process Data", x: 100, y: 200 },
      { id: "node-3", type: "end", label: "End", x: 100, y: 300 },
    ],
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000,
  },
  {
    id: "3",
    title: "Meeting Notes",
    preview: "Q4 planning session with product team...",
    date: "1 hour ago",
    tags: ["meetings"],
    color: "success",
    systemId: "system-1",
    projectId: "project-2",
    editorType: "modular",
    content: [
      { id: "1", type: "heading", content: "Meeting Notes", metadata: { level: 1 } },
      { id: "2", type: "paragraph", content: "Q4 planning session with product team." },
    ],
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: "4",
    title: "Design System",
    preview: "Typography guidelines, spacing tokens, and color palette...",
    date: "2 hours ago",
    tags: ["design"],
    color: "accent",
    systemId: "system-1",
    projectId: "project-2",
    editorType: "standard",
    content: "",
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 7200000,
  },
  {
    id: "5",
    title: "API Documentation",
    preview: "REST endpoints, authentication flow, and rate limits...",
    date: "Yesterday",
    tags: ["docs", "api"],
    color: "primary",
    systemId: "system-1",
    projectId: "project-1",
    editorType: "standard",
    content: "# API Documentation\n\nREST endpoints, authentication flow, and rate limits.",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
];

// Context
const NotesContext = createContext<NotesStore | null>(null);

// Provider
export function NotesProvider({ children }: { children: ReactNode }) {
  const [systems, setSystems] = useLocalStorage<System[]>("kol-noter-systems", defaultSystems);
  const [notes, setNotes] = useLocalStorage<Note[]>("kol-noter-notes", defaultNotes);
  const [trash, setTrash] = useLocalStorage<Note[]>("kol-noter-trash", []);

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
    };
    setSystems([...systems, newSystem]);
    return newSystem;
  };

  const updateSystem = (id: string, name: string) => {
    setSystems(systems.map(s => s.id === id ? { ...s, name } : s));
  };

  const deleteSystem = (id: string) => {
    setSystems(systems.filter(s => s.id !== id));
    // Also delete all notes in this system
    setNotes(notes.filter(n => n.systemId !== id));
  };

  const updateSystemMetadata = (id: string, updates: Partial<Omit<System, "id" | "projects">>) => {
    setSystems(systems.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        ...updates,
        updatedAt: Date.now(),
      };
    }));
  };

  const getSystem = (id: string): System | undefined => {
    return systems.find(s => s.id === id);
  };

  // Project operations
  const addProject = (systemId: string, name: string): Project | null => {
    const newProject: Project = {
      id: generateId(),
      name,
    };
    const systemIndex = systems.findIndex(s => s.id === systemId);
    if (systemIndex === -1) return null;

    const updatedSystems = [...systems];
    updatedSystems[systemIndex] = {
      ...updatedSystems[systemIndex],
      projects: [...updatedSystems[systemIndex].projects, newProject],
    };
    setSystems(updatedSystems);
    return newProject;
  };

  const updateProject = (systemId: string, projectId: string, name: string) => {
    setSystems(systems.map(s => {
      if (s.id !== systemId) return s;
      return {
        ...s,
        projects: s.projects.map(p => p.id === projectId ? { ...p, name } : p),
      };
    }));
  };

  const deleteProject = (systemId: string, projectId: string) => {
    setSystems(systems.map(s => {
      if (s.id !== systemId) return s;
      return {
        ...s,
        projects: s.projects.filter(p => p.id !== projectId),
      };
    }));
    // Also delete all notes in this project
    setNotes(notes.filter(n => !(n.systemId === systemId && n.projectId === projectId)));
  };

  const updateProjectMetadata = (systemId: string, projectId: string, updates: Partial<Omit<Project, "id">>) => {
    setSystems(systems.map(s => {
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
      };
    }));
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
      case "standard":
        defaultContent = "";
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
    setNotes([newNote, ...notes]);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Omit<Note, "id">>) => {
    setNotes(notes.map(n => {
      if (n.id !== id) return n;
      return {
        ...n,
        ...updates,
        updatedAt: Date.now(),
      };
    }));
  };

  const saveAttachment = (noteId: string, filename: string, dataUrl: string) => {
    setNotes(notes.map(n => {
      if (n.id !== noteId) return n;
      return {
        ...n,
        attachments: {
          ...n.attachments,
          [filename]: dataUrl,
        },
        updatedAt: Date.now(),
      };
    }));
  };

  const updateNoteContent = (id: string, content: Block[] | string | VisualNode[]) => {
    setNotes(notes.map(n => {
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
    }));
  };

  const deleteNote = (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (noteToDelete) {
      setTrash([noteToDelete, ...trash]);
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const restoreNote = (id: string) => {
    const noteToRestore = trash.find(n => n.id === id);
    if (noteToRestore) {
      setNotes([noteToRestore, ...notes]);
      setTrash(trash.filter(n => n.id !== id));
    }
  };

  const permanentlyDeleteNote = (id: string) => {
    setTrash(trash.filter(n => n.id !== id));
  };

  const emptyTrash = () => {
    setTrash([]);
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

  // Update tag color for a note
  const updateNoteTagColor = (noteId: string, tagName: string, color: string) => {
    setNotes(notes.map(n => {
      if (n.id !== noteId) return n;
      return {
        ...n,
        tagColors: {
          ...n.tagColors,
          [tagName]: color,
        },
        updatedAt: Date.now(),
      };
    }));
  };

  // Update tag color for a project
  const updateProjectTagColor = (systemId: string, projectId: string, tagName: string, color: string) => {
    setSystems(systems.map(s => {
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
      };
    }));
  };

  // Update tag color for a system
  const updateSystemTagColor = (systemId: string, tagName: string, color: string) => {
    setSystems(systems.map(s => {
      if (s.id !== systemId) return s;
      return {
        ...s,
        tagColors: {
          ...s.tagColors,
          [tagName]: color,
        },
        updatedAt: Date.now(),
      };
    }));
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
  };

  // Photo operations
  const addSystemPhoto = (systemId: string, name: string, dataUrl: string) => {
    const newPhoto: Photo = { id: crypto.randomUUID(), name, dataUrl, addedAt: Date.now() };
    setSystems(systems.map(s => s.id !== systemId ? s : { ...s, photos: [...(s.photos || []), newPhoto], updatedAt: Date.now() }));
  };

  const removeSystemPhoto = (systemId: string, photoId: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : { ...s, photos: (s.photos || []).filter(p => p.id !== photoId), updatedAt: Date.now() }));
  };

  const addProjectPhoto = (systemId: string, projectId: string, name: string, dataUrl: string) => {
    const newPhoto: Photo = { id: crypto.randomUUID(), name, dataUrl, addedAt: Date.now() };
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : { ...p, photos: [...(p.photos || []), newPhoto], updatedAt: Date.now() }),
    }));
  };

  const removeProjectPhoto = (systemId: string, projectId: string, photoId: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : { ...p, photos: (p.photos || []).filter(ph => ph.id !== photoId), updatedAt: Date.now() }),
    }));
  };

  // Voice recording operations
  const addSystemVoiceRecording = (systemId: string, name: string, dataUrl: string, duration?: string) => {
    const newRec: VoiceRecording = { id: crypto.randomUUID(), name, dataUrl, duration, addedAt: Date.now() };
    setSystems(systems.map(s => s.id !== systemId ? s : { ...s, voiceRecordings: [...(s.voiceRecordings || []), newRec], updatedAt: Date.now() }));
  };

  const removeSystemVoiceRecording = (systemId: string, recordingId: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : { ...s, voiceRecordings: (s.voiceRecordings || []).filter(r => r.id !== recordingId), updatedAt: Date.now() }));
  };

  const addProjectVoiceRecording = (systemId: string, projectId: string, name: string, dataUrl: string, duration?: string) => {
    const newRec: VoiceRecording = { id: crypto.randomUUID(), name, dataUrl, duration, addedAt: Date.now() };
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : { ...p, voiceRecordings: [...(p.voiceRecordings || []), newRec], updatedAt: Date.now() }),
    }));
  };

  const removeProjectVoiceRecording = (systemId: string, projectId: string, recordingId: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : { ...p, voiceRecordings: (p.voiceRecordings || []).filter(r => r.id !== recordingId), updatedAt: Date.now() }),
    }));
  };

  // Link operations
  const addSystemLink = (systemId: string, url: string, title?: string) => {
    const newLink: SavedLink = { id: crypto.randomUUID(), url, title, addedAt: Date.now() };
    setSystems(systems.map(s => s.id !== systemId ? s : { ...s, links: [...(s.links || []), newLink], updatedAt: Date.now() }));
  };

  const removeSystemLink = (systemId: string, linkId: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : { ...s, links: (s.links || []).filter(l => l.id !== linkId), updatedAt: Date.now() }));
  };

  const updateSystemLink = (systemId: string, linkId: string, updates: Partial<SavedLink>) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      links: (s.links || []).map(l => l.id !== linkId ? l : { ...l, ...updates }),
      updatedAt: Date.now(),
    }));
  };

  const addProjectLink = (systemId: string, projectId: string, url: string, title?: string) => {
    const newLink: SavedLink = { id: crypto.randomUUID(), url, title, addedAt: Date.now() };
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : { ...p, links: [...(p.links || []), newLink], updatedAt: Date.now() }),
    }));
  };

  const removeProjectLink = (systemId: string, projectId: string, linkId: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : { ...p, links: (p.links || []).filter(l => l.id !== linkId), updatedAt: Date.now() }),
    }));
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
  };

  // Detail notes operations
  const updateSystemDetailNotes = (systemId: string, notes: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : { ...s, detailNotes: notes, updatedAt: Date.now() }));
  };

  const updateProjectDetailNotes = (systemId: string, projectId: string, notes: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      projects: s.projects.map(p => p.id !== projectId ? p : { ...p, detailNotes: notes, updatedAt: Date.now() }),
    }));
  };

  // Tag operations for system/project
  const addSystemTag = (systemId: string, tag: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      tags: [...new Set([...(s.tags || []), tag.toLowerCase()])],
      updatedAt: Date.now(),
    }));
  };

  const removeSystemTag = (systemId: string, tag: string) => {
    setSystems(systems.map(s => s.id !== systemId ? s : {
      ...s,
      tags: (s.tags || []).filter(t => t !== tag),
      updatedAt: Date.now(),
    }));
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
  };

  const store: NotesStore = {
    systems,
    notes,
    trash,
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
    getAggregatedTags,
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
