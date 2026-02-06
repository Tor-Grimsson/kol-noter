/**
 * LocalStorage Persistence Adapter
 *
 * Implements IPersistenceAdapter using browser localStorage.
 * This is the fallback adapter when running in a browser without Tauri.
 */

import type { System, Note, Project } from '@/store/NotesContext';
import type { IPersistenceAdapter, VaultData } from './types';
import { STORAGE_KEYS } from './types';

const defaultSystems: System[] = [];
const defaultNotes: Note[] = [];

export class LocalStorageAdapter implements IPersistenceAdapter {
  readonly name = 'localStorage';

  isAvailable(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  async initialize(): Promise<string | null> {
    // No initialization needed for localStorage
    // Return null to indicate no vault path
    return null;
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async loadAll(): Promise<VaultData> {
    const systems = this.getItem<System[]>(STORAGE_KEYS.SYSTEMS, defaultSystems);
    const notes = this.getItem<Note[]>(STORAGE_KEYS.NOTES, defaultNotes);
    const trash = this.getItem<Note[]>(STORAGE_KEYS.TRASH, []);

    return { systems, notes, trash };
  }

  async loadSystems(): Promise<System[]> {
    return this.getItem<System[]>(STORAGE_KEYS.SYSTEMS, defaultSystems);
  }

  async loadNotes(): Promise<Note[]> {
    return this.getItem<Note[]>(STORAGE_KEYS.NOTES, defaultNotes);
  }

  async loadNotesByProject(systemId: string, projectId: string): Promise<Note[]> {
    const notes = await this.loadNotes();
    return notes.filter(n => n.systemId === systemId && n.projectId === projectId);
  }

  async loadTrash(): Promise<Note[]> {
    return this.getItem<Note[]>(STORAGE_KEYS.TRASH, []);
  }

  async saveSystem(system: System): Promise<void> {
    const systems = await this.loadSystems();
    const index = systems.findIndex(s => s.id === system.id);

    if (index >= 0) {
      systems[index] = system;
    } else {
      systems.push(system);
    }

    this.setItem(STORAGE_KEYS.SYSTEMS, systems);
  }

  async deleteSystem(systemId: string): Promise<void> {
    // Delete the system
    const systems = await this.loadSystems();
    this.setItem(STORAGE_KEYS.SYSTEMS, systems.filter(s => s.id !== systemId));

    // Delete all notes in this system
    const notes = await this.loadNotes();
    this.setItem(STORAGE_KEYS.NOTES, notes.filter(n => n.systemId !== systemId));
  }

  async saveProject(systemId: string, project: Project): Promise<void> {
    const systems = await this.loadSystems();
    const systemIndex = systems.findIndex(s => s.id === systemId);

    if (systemIndex < 0) {
      throw new Error(`System ${systemId} not found`);
    }

    const projectIndex = systems[systemIndex].projects.findIndex(p => p.id === project.id);

    if (projectIndex >= 0) {
      systems[systemIndex].projects[projectIndex] = project;
    } else {
      systems[systemIndex].projects.push(project);
    }

    this.setItem(STORAGE_KEYS.SYSTEMS, systems);
  }

  async deleteProject(systemId: string, projectId: string): Promise<void> {
    // Delete the project from system
    const systems = await this.loadSystems();
    const systemIndex = systems.findIndex(s => s.id === systemId);

    if (systemIndex >= 0) {
      systems[systemIndex].projects = systems[systemIndex].projects.filter(
        p => p.id !== projectId
      );
      this.setItem(STORAGE_KEYS.SYSTEMS, systems);
    }

    // Delete all notes in this project
    const notes = await this.loadNotes();
    this.setItem(
      STORAGE_KEYS.NOTES,
      notes.filter(n => !(n.systemId === systemId && n.projectId === projectId))
    );
  }

  async saveNote(note: Note): Promise<void> {
    const notes = await this.loadNotes();
    const index = notes.findIndex(n => n.id === note.id);

    if (index >= 0) {
      notes[index] = note;
    } else {
      notes.unshift(note); // Add to beginning
    }

    this.setItem(STORAGE_KEYS.NOTES, notes);
  }

  async deleteNote(noteId: string): Promise<void> {
    const notes = await this.loadNotes();
    const noteToDelete = notes.find(n => n.id === noteId);

    if (noteToDelete) {
      // Move to trash
      const trash = await this.loadTrash();
      trash.unshift(noteToDelete);
      this.setItem(STORAGE_KEYS.TRASH, trash);

      // Remove from notes
      this.setItem(STORAGE_KEYS.NOTES, notes.filter(n => n.id !== noteId));
    }
  }

  async permanentlyDeleteNote(noteId: string): Promise<void> {
    const trash = await this.loadTrash();
    this.setItem(STORAGE_KEYS.TRASH, trash.filter(n => n.id !== noteId));
  }

  async restoreNote(noteId: string): Promise<void> {
    const trash = await this.loadTrash();
    const noteToRestore = trash.find(n => n.id === noteId);

    if (noteToRestore) {
      // Add back to notes
      const notes = await this.loadNotes();
      notes.unshift(noteToRestore);
      this.setItem(STORAGE_KEYS.NOTES, notes);

      // Remove from trash
      this.setItem(STORAGE_KEYS.TRASH, trash.filter(n => n.id !== noteId));
    }
  }

  async emptyTrash(): Promise<void> {
    this.setItem(STORAGE_KEYS.TRASH, []);
  }

  async saveAttachment(noteId: string, filename: string, data: string | Blob): Promise<string> {
    // For localStorage, attachments are stored as base64 data URLs in the note
    const notes = await this.loadNotes();
    const noteIndex = notes.findIndex(n => n.id === noteId);

    if (noteIndex < 0) {
      throw new Error(`Note ${noteId} not found`);
    }

    let dataUrl: string;

    if (typeof data === 'string') {
      dataUrl = data;
    } else {
      // Convert Blob to data URL
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(data);
      });
    }

    notes[noteIndex].attachments = {
      ...notes[noteIndex].attachments,
      [filename]: dataUrl,
    };
    notes[noteIndex].updatedAt = Date.now();

    this.setItem(STORAGE_KEYS.NOTES, notes);

    return filename;
  }

  async deleteAttachment(noteId: string, filename: string): Promise<void> {
    const notes = await this.loadNotes();
    const noteIndex = notes.findIndex(n => n.id === noteId);

    if (noteIndex >= 0 && notes[noteIndex].attachments) {
      delete notes[noteIndex].attachments[filename];
      notes[noteIndex].updatedAt = Date.now();
      this.setItem(STORAGE_KEYS.NOTES, notes);
    }
  }

  async getAttachment(noteId: string, filename: string): Promise<string> {
    const notes = await this.loadNotes();
    const note = notes.find(n => n.id === noteId);

    if (!note?.attachments?.[filename]) {
      throw new Error(`Attachment ${filename} not found for note ${noteId}`);
    }

    return note.attachments[filename];
  }

  async getNoteSize(noteId: string): Promise<number> {
    // localStorage doesn't support file size calculation
    // Return 0 as a reasonable fallback
    return 0;
  }

  // localStorage doesn't support external change watching
  onExternalChange = undefined;
}

/**
 * Singleton instance for the localStorage adapter
 */
export const localStorageAdapter = new LocalStorageAdapter();
