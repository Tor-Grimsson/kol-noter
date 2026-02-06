// Core types for the notes store - extracted for reuse

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

// Color presets for tags and notes
export interface ColorPreset {
  name: string;
  value: string;
}

export const TAG_COLOR_PRESETS: ColorPreset[] = [
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

// Block types for content
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

// Visual node types for visual editor
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

export interface Contact {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  socials?: string;
  imageUrl?: string;
}

// Project type
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
  contacts?: Contact[];
  customField1?: string;
  customField2?: string;
  customField3?: string;
  detailNotes?: string;
  mentions?: string[]; // IDs of linked items
  reminders?: Reminder[];
  metrics?: ItemMetrics;
  color?: string;
  icon?: string;
  createdAt?: number;
  updatedAt?: number;
}

// System type (contains projects)
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
  contacts?: Contact[];
  customField1?: string;
  customField2?: string;
  customField3?: string;
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

// Note type
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
  /** ID of the photo to use as cover image (separate from photos array) */
  coverPhotoId?: string;
  systemId: string;
  projectId: string;
  editorType: EditorType;
  content: Block[] | string | VisualNode[];
  attachments?: {
    [filename: string]: string; // filename -> base64 data URL
  };
  photos?: Photo[];
  voiceRecordings?: VoiceRecording[];
  links?: SavedLink[];
  customType?: string;
  customField1?: string;
  customField2?: string;
  customField3?: string;
  detailNotes?: string;
  metrics?: ItemMetrics;
  contacts?: Contact[];
  createdAt: number;
  updatedAt: number;
}

