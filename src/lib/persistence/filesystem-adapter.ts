/**
 * File System Persistence Adapter
 *
 * Implements IPersistenceAdapter using the native file system via Tauri.
 * Creates an Obsidian-compatible vault structure.
 */

import type { System, Note, Project, Block, VisualNode } from '@/store/NotesContext';
import type {
  IPersistenceAdapter,
  VaultData,
  IdMap,
  ExternalChangeEvent,
} from './types';
import { FILE_PATTERNS } from './types';
import {
  isTauri,
  readFile,
  writeFile,
  writeDataUrlAsFile,
  readFileAsDataUrl,
  pathExists,
  createDirectory,
  removePath,
  renamePath,
  readDirectory,
  joinPath,
  getFilename,
  getDirname,
  removeExtension,
  getStoredVaultConfig,
  storeVaultConfig,
  initializeVault,
  isValidVault,
  getFileSize,
  VAULT_CONFIG_DIR,
  VAULT_ID_MAP_FILE,
  type FileEntry,
} from '@/lib/tauri-bridge';
import {
  NoteSerializer,
  SystemSerializer,
  ProjectSerializer,
  generateSlug,
  ensureUniqueSlug,
} from '@/lib/serialization/note-serializer';

export class FilesystemAdapter implements IPersistenceAdapter {
  readonly name = 'filesystem';

  private vaultPath: string = '';
  private idMap: IdMap = { notes: {}, systems: {}, projects: {} };
  private changeListeners: Set<(event: ExternalChangeEvent) => void> = new Set();

  isAvailable(): boolean {
    return isTauri();
  }

  async initialize(): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    // Check for stored vault config
    const config = getStoredVaultConfig();

    if (config?.vaultPath) {
      const valid = await isValidVault(config.vaultPath);

      if (valid) {
        this.vaultPath = config.vaultPath;
        await this.loadIdMap();
        return this.vaultPath;
      }
    }

    return null;
  }

  /**
   * Set the vault path after user selects it
   */
  async setVaultPath(path: string, createNew = false): Promise<void> {
    if (createNew) {
      await initializeVault(path);
    } else {
      const valid = await isValidVault(path);
      if (!valid) {
        throw new Error('Invalid vault: missing .kol-noter configuration');
      }
    }

    this.vaultPath = path;
    storeVaultConfig({ vaultPath: path, lastOpened: Date.now() });
    await this.loadIdMap();
  }

  /**
   * Get the current vault path
   */
  getVaultPath(): string {
    return this.vaultPath;
  }

  /**
   * Get the relative path for a note from the idMap.
   * Returns undefined if the note is not in the map.
   */
  getNoteRelativePath(noteId: string): string | undefined {
    return this.idMap.notes[noteId];
  }

  private async loadIdMap(): Promise<void> {
    const idMapPath = joinPath(this.vaultPath, VAULT_CONFIG_DIR, VAULT_ID_MAP_FILE);

    if (await pathExists(idMapPath)) {
      const content = await readFile(idMapPath);
      this.idMap = JSON.parse(content);
    } else {
      this.idMap = { notes: {}, systems: {}, projects: {} };
    }
  }

  private async saveIdMap(): Promise<void> {
    const idMapPath = joinPath(this.vaultPath, VAULT_CONFIG_DIR, VAULT_ID_MAP_FILE);
    await writeFile(idMapPath, JSON.stringify(this.idMap, null, 2));
  }

  async loadAll(): Promise<VaultData> {
    if (!this.vaultPath) {
      throw new Error('Vault not initialized');
    }

    const systems = await this.loadSystems();
    const notes = await this.loadNotes();
    const trash = await this.loadTrash();

    return { systems, notes, trash };
  }

  async loadSystems(): Promise<System[]> {
    if (!this.vaultPath) {
      return [];
    }

    const systems: System[] = [];
    const entries = await readDirectory(this.vaultPath, false);

    for (const entry of entries) {
      // Skip hidden directories and files
      if (entry.name.startsWith('.') || !entry.isDirectory) {
        continue;
      }

      const systemMetaPath = joinPath(entry.path, FILE_PATTERNS.SYSTEM_METADATA);

      let systemMetaExists = false;
      try {
        systemMetaExists = await pathExists(systemMetaPath);
      } catch {
        // Path not accessible - skip this entry
        continue;
      }

      if (systemMetaExists) {
        try {
          const content = await readFile(systemMetaPath);
          const system = SystemSerializer.deserialize(content);

          // Load projects for this system
          system.projects = await this.loadProjectsForSystem(entry.path, system.id);

          // Update ID map
          this.idMap.systems[system.id] = entry.name;

          systems.push(system);
        } catch (e) {
          console.error(`Failed to load system from ${entry.path}:`, e);
        }
      }
    }

    await this.saveIdMap();
    return systems;
  }

  private async loadProjectsForSystem(systemPath: string, systemId: string): Promise<Project[]> {
    const projects: Project[] = [];
    const entries = await readDirectory(systemPath, false);

    for (const entry of entries) {
      // Skip hidden directories, files, and assets
      if (
        entry.name.startsWith('.') ||
        entry.name.startsWith('_') ||
        entry.name === FILE_PATTERNS.ASSETS_DIR ||
        !entry.isDirectory
      ) {
        continue;
      }

      const projectMetaPath = joinPath(entry.path, FILE_PATTERNS.PROJECT_METADATA);

      if (await pathExists(projectMetaPath)) {
        try {
          const content = await readFile(projectMetaPath);
          const project = ProjectSerializer.deserialize(content);

          // Update ID map
          this.idMap.projects[project.id] = `${this.idMap.systems[systemId]}/${entry.name}`;

          projects.push(project);
        } catch (e) {
          console.error(`Failed to load project from ${entry.path}:`, e);
        }
      }
    }

    return projects;
  }

  async loadNotes(): Promise<Note[]> {
    if (!this.vaultPath) {
      return [];
    }

    const notes: Note[] = [];

    // Iterate through all systems and projects
    const systemEntries = await readDirectory(this.vaultPath, false);

    for (const systemEntry of systemEntries) {
      if (systemEntry.name.startsWith('.') || !systemEntry.isDirectory) {
        continue;
      }

      // Find system ID from path
      const systemId = Object.entries(this.idMap.systems).find(
        ([, path]) => path === systemEntry.name
      )?.[0];

      if (!systemId) continue;

      const projectEntries = await readDirectory(systemEntry.path, false);

      for (const projectEntry of projectEntries) {
        if (
          projectEntry.name.startsWith('.') ||
          projectEntry.name.startsWith('_') ||
          projectEntry.name === FILE_PATTERNS.ASSETS_DIR ||
          !projectEntry.isDirectory
        ) {
          continue;
        }

        // Find project ID from path
        const projectRelPath = `${systemEntry.name}/${projectEntry.name}`;
        const projectId = Object.entries(this.idMap.projects).find(
          ([, path]) => path === projectRelPath
        )?.[0];

        if (!projectId) continue;

        // Load notes from this project
        const projectNotes = await this.loadNotesFromDirectory(
          projectEntry.path,
          systemId,
          projectId
        );
        notes.push(...projectNotes);
      }
    }

    await this.saveIdMap();
    return notes;
  }

  private async loadNotesFromDirectory(
    dirPath: string,
    systemId: string,
    projectId: string
  ): Promise<Note[]> {
    const notes: Note[] = [];
    const entries = await readDirectory(dirPath, false);

    for (const entry of entries) {
      // Skip directories, hidden files, metadata files, and sidecar files
      if (
        entry.isDirectory ||
        entry.name.startsWith('.') ||
        entry.name.startsWith('_') ||
        entry.name.endsWith(FILE_PATTERNS.VISUAL_SIDECAR_SUFFIX)
      ) {
        continue;
      }

      // Only process .md files
      if (!entry.name.endsWith('.md')) {
        continue;
      }

      try {
        const content = await readFile(entry.path);

        // Check for visual sidecar
        const basePath = removeExtension(entry.path);
        const sidecarPath = basePath + FILE_PATTERNS.VISUAL_SIDECAR_SUFFIX;
        let visualData: VisualNode[] | undefined;

        if (await pathExists(sidecarPath)) {
          const sidecarContent = await readFile(sidecarPath);
          visualData = JSON.parse(sidecarContent);
        }

        const note = NoteSerializer.deserialize(content, visualData, removeExtension(entry.name));
        note.systemId = systemId;
        note.projectId = projectId;

        // Update ID map
        const relativePath = entry.path.replace(this.vaultPath + '/', '');
        this.idMap.notes[note.id] = relativePath;

        // Scan _assets directory — discover files not already listed in frontmatter.
        // Photos and files from frontmatter are already populated by the deserializer.
        // Images are resolved at render time via convertFileSrc (asset protocol).
        const noteDir = getDirname(entry.path);
        const assetsDir = joinPath(noteDir, FILE_PATTERNS.ASSETS_DIR);
        if (await pathExists(assetsDir)) {
          try {
            const assetEntries = await readDirectory(assetsDir, false);
            const filenames = assetEntries
              .filter(a => !a.isDirectory && !a.name.startsWith('.'))
              .map(a => a.name);

            // Build set of filenames already known from frontmatter
            const knownFiles = new Set<string>();
            if (note.photos) {
              for (const p of note.photos) knownFiles.add(p.name);
            }
            if (note.attachments) {
              for (const f of Object.keys(note.attachments)) knownFiles.add(f);
            }

            // Merge unknown files into attachments as fallback
            const unknownFiles = filenames.filter(f => !knownFiles.has(f));
            if (unknownFiles.length > 0) {
              if (!note.attachments) note.attachments = {};
              for (const name of unknownFiles) {
                note.attachments[name] = '';
              }
            }
          } catch {
            // _assets dir unreadable, skip
          }
        }

        notes.push(note);
      } catch (e) {
        console.error(`Failed to load note from ${entry.path}:`, e);
      }
    }

    return notes;
  }

  async loadNotesByProject(systemId: string, projectId: string): Promise<Note[]> {
    const projectPath = this.idMap.projects[projectId];
    if (!projectPath) {
      return [];
    }

    const fullPath = joinPath(this.vaultPath, projectPath);
    return this.loadNotesFromDirectory(fullPath, systemId, projectId);
  }

  async loadTrash(): Promise<Note[]> {
    const trashPath = joinPath(this.vaultPath, VAULT_CONFIG_DIR, 'trash');

    if (!(await pathExists(trashPath))) {
      return [];
    }

    const notes: Note[] = [];
    const entries = await readDirectory(trashPath, false);

    for (const entry of entries) {
      if (!entry.name.endsWith('.json')) {
        continue;
      }

      try {
        const content = await readFile(entry.path);
        const note = JSON.parse(content) as Note;
        notes.push(note);
      } catch (e) {
        console.error(`Failed to load trash note from ${entry.path}:`, e);
      }
    }

    return notes;
  }

  async saveSystem(system: System): Promise<void> {
    if (!this.vaultPath) {
      throw new Error('Vault not initialized');
    }

    // Determine folder name
    let folderName = this.idMap.systems[system.id];

    if (!folderName) {
      // New system - generate folder name
      const existingFolders = Object.values(this.idMap.systems);
      folderName = await ensureUniqueSlug(
        generateSlug(system.name),
        existingFolders
      );
      this.idMap.systems[system.id] = folderName;
    }

    const systemPath = joinPath(this.vaultPath, folderName);

    // Create directory if it doesn't exist
    if (!(await pathExists(systemPath))) {
      await createDirectory(systemPath);
    }

    // Write system metadata
    const content = SystemSerializer.serialize(system);
    await writeFile(joinPath(systemPath, FILE_PATTERNS.SYSTEM_METADATA), content);

    await this.saveIdMap();
  }

  async deleteSystem(systemId: string): Promise<void> {
    const folderName = this.idMap.systems[systemId];
    if (!folderName) {
      return;
    }

    const systemPath = joinPath(this.vaultPath, folderName);
    await removePath(systemPath, true);

    // Clean up ID map
    delete this.idMap.systems[systemId];

    // Also remove projects and notes for this system
    for (const [projectId, projectPath] of Object.entries(this.idMap.projects)) {
      if (projectPath.startsWith(folderName + '/')) {
        delete this.idMap.projects[projectId];
      }
    }

    for (const [noteId, notePath] of Object.entries(this.idMap.notes)) {
      if (notePath.startsWith(folderName + '/')) {
        delete this.idMap.notes[noteId];
      }
    }

    await this.saveIdMap();
  }

  async saveProject(systemId: string, project: Project): Promise<void> {
    const systemFolder = this.idMap.systems[systemId];
    if (!systemFolder) {
      throw new Error(`System ${systemId} not found`);
    }

    // Determine folder name
    let folderName = this.idMap.projects[project.id]?.split('/')[1];

    if (!folderName) {
      // New project - generate folder name
      const systemPath = joinPath(this.vaultPath, systemFolder);
      const existingEntries = await readDirectory(systemPath, false);
      const existingFolders = existingEntries
        .filter(e => e.isDirectory && !e.name.startsWith('.') && !e.name.startsWith('_'))
        .map(e => e.name);

      folderName = await ensureUniqueSlug(
        generateSlug(project.name),
        existingFolders
      );
      this.idMap.projects[project.id] = `${systemFolder}/${folderName}`;
    }

    const projectPath = joinPath(this.vaultPath, systemFolder, folderName);

    // Create directory if it doesn't exist
    if (!(await pathExists(projectPath))) {
      await createDirectory(projectPath);
    }

    // Write project metadata
    const content = ProjectSerializer.serialize(project);
    await writeFile(joinPath(projectPath, FILE_PATTERNS.PROJECT_METADATA), content);

    await this.saveIdMap();
  }

  async deleteProject(systemId: string, projectId: string): Promise<void> {
    const projectPath = this.idMap.projects[projectId];
    if (!projectPath) {
      return;
    }

    const fullPath = joinPath(this.vaultPath, projectPath);
    await removePath(fullPath, true);

    // Clean up ID map
    delete this.idMap.projects[projectId];

    // Also remove notes for this project
    for (const [noteId, notePath] of Object.entries(this.idMap.notes)) {
      if (notePath.startsWith(projectPath + '/')) {
        delete this.idMap.notes[noteId];
      }
    }

    await this.saveIdMap();
  }

  async saveNote(note: Note): Promise<void> {
    const projectPath = this.idMap.projects[note.projectId];
    if (!projectPath) {
      throw new Error(`Project ${note.projectId} not found`);
    }

    const projectFullPath = joinPath(this.vaultPath, projectPath);

    // Determine file name
    let existingPath = this.idMap.notes[note.id];
    let filename: string;

    if (existingPath) {
      filename = getFilename(existingPath);
    } else {
      // New note - generate filename
      const existingEntries = await readDirectory(projectFullPath, false);
      const existingFiles = existingEntries
        .filter(e => e.isFile && e.name.endsWith('.md') && !e.name.startsWith('_'))
        .map(e => removeExtension(e.name));

      const slug = await ensureUniqueSlug(
        generateSlug(note.title || 'untitled'),
        existingFiles
      );
      filename = slug + '.md';
      this.idMap.notes[note.id] = `${projectPath}/${filename}`;
    }

    const notePath = joinPath(projectFullPath, filename);

    // Serialize based on editor type
    const { markdown, visualData } = NoteSerializer.serialize(note);

    await writeFile(notePath, markdown);

    // Handle visual sidecar
    if (visualData) {
      const sidecarPath = removeExtension(notePath) + FILE_PATTERNS.VISUAL_SIDECAR_SUFFIX;
      await writeFile(sidecarPath, JSON.stringify(visualData, null, 2));
    }

    await this.saveIdMap();
  }

  async deleteNote(noteId: string): Promise<void> {
    const notePath = this.idMap.notes[noteId];
    if (!notePath) {
      return;
    }

    const fullPath = joinPath(this.vaultPath, notePath);

    // Read the note first to save to trash
    if (await pathExists(fullPath)) {
      try {
        const content = await readFile(fullPath);

        // Check for visual sidecar
        const basePath = removeExtension(fullPath);
        const sidecarPath = basePath + FILE_PATTERNS.VISUAL_SIDECAR_SUFFIX;
        let visualData: VisualNode[] | undefined;

        if (await pathExists(sidecarPath)) {
          const sidecarContent = await readFile(sidecarPath);
          visualData = JSON.parse(sidecarContent);
          await removePath(sidecarPath);
        }

        const note = NoteSerializer.deserialize(content, visualData);

        // Save to trash
        const trashPath = joinPath(this.vaultPath, VAULT_CONFIG_DIR, 'trash');
        await createDirectory(trashPath);
        await writeFile(
          joinPath(trashPath, `${noteId}.json`),
          JSON.stringify(note, null, 2)
        );
      } catch (e) {
        console.error('Failed to backup note to trash:', e);
      }

      await removePath(fullPath);
    }

    // Clean up ID map
    delete this.idMap.notes[noteId];
    await this.saveIdMap();
  }

  async permanentlyDeleteNote(noteId: string): Promise<void> {
    const trashPath = joinPath(this.vaultPath, VAULT_CONFIG_DIR, 'trash', `${noteId}.json`);

    if (await pathExists(trashPath)) {
      await removePath(trashPath);
    }
  }

  async restoreNote(noteId: string): Promise<void> {
    const trashPath = joinPath(this.vaultPath, VAULT_CONFIG_DIR, 'trash', `${noteId}.json`);

    if (!(await pathExists(trashPath))) {
      throw new Error(`Note ${noteId} not found in trash`);
    }

    const content = await readFile(trashPath);
    const note = JSON.parse(content) as Note;

    // Save the note back to its project
    await this.saveNote(note);

    // Remove from trash
    await removePath(trashPath);
  }

  async emptyTrash(): Promise<void> {
    const trashPath = joinPath(this.vaultPath, VAULT_CONFIG_DIR, 'trash');

    if (await pathExists(trashPath)) {
      await removePath(trashPath, true);
      await createDirectory(trashPath);
    }
  }

  async saveAttachment(noteId: string, filename: string, data: string | Blob): Promise<string> {
    const notePath = this.idMap.notes[noteId];
    if (!notePath) {
      throw new Error(`Note ${noteId} not found`);
    }

    const noteDir = getDirname(joinPath(this.vaultPath, notePath));
    const assetsDir = joinPath(noteDir, FILE_PATTERNS.ASSETS_DIR);

    // Create assets directory if needed
    if (!(await pathExists(assetsDir))) {
      await createDirectory(assetsDir);
    }

    const filePath = joinPath(assetsDir, filename);

    // Convert data to appropriate format and write
    if (typeof data === 'string') {
      if (data.startsWith('data:')) {
        // Data URL - write as binary file
        await writeDataUrlAsFile(filePath, data);
      } else {
        // Plain text content
        await writeFile(filePath, data);
      }
    } else {
      // Blob - convert to data URL then write as binary
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(data);
      });
      await writeDataUrlAsFile(filePath, dataUrl);
    }

    // Return relative path from note to asset
    return `${FILE_PATTERNS.ASSETS_DIR}/${filename}`;
  }

  async deleteAttachment(noteId: string, filename: string): Promise<void> {
    const notePath = this.idMap.notes[noteId];
    if (!notePath) {
      return;
    }

    const noteDir = getDirname(joinPath(this.vaultPath, notePath));
    const filePath = joinPath(noteDir, FILE_PATTERNS.ASSETS_DIR, filename);

    if (await pathExists(filePath)) {
      await removePath(filePath);
    }
  }

  async getAttachment(noteId: string, filename: string): Promise<string> {
    const notePath = this.idMap.notes[noteId];
    if (!notePath) {
      throw new Error(`Note ${noteId} not found`);
    }

    const noteDir = getDirname(joinPath(this.vaultPath, notePath));
    const filePath = joinPath(noteDir, FILE_PATTERNS.ASSETS_DIR, filename);

    // Determine MIME type from extension
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'json': 'application/json',
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // Read binary file and return as data URL
    return readFileAsDataUrl(filePath, mimeType);
  }

  async getNoteSize(noteId: string): Promise<number> {
    const notePath = this.idMap.notes[noteId];
    if (!notePath) {
      return 0;
    }

    const noteFullPath = joinPath(this.vaultPath, notePath);

    // Get note file size
    let totalSize = 0;
    if (await pathExists(noteFullPath)) {
      totalSize = await getFileSize(noteFullPath);
    }

    // Sum _assets folder size
    const noteDir = getDirname(noteFullPath);
    const assetsDir = joinPath(noteDir, FILE_PATTERNS.ASSETS_DIR);

    if (await pathExists(assetsDir)) {
      const entries = await readDirectory(assetsDir, false);
      for (const entry of entries) {
        if (entry.isFile) {
          const filePath = joinPath(assetsDir, entry.name);
          totalSize += await getFileSize(filePath);
        }
      }
    }

    return totalSize;
  }

  // ── Rename operations ──────────────────────────────────────────────

  /**
   * Rename a system folder on disk and update all child paths in the idMap.
   */
  async renameSystem(systemId: string, newName: string): Promise<void> {
    const oldFolder = this.idMap.systems[systemId];
    if (!oldFolder) return;

    const existingFolders = Object.values(this.idMap.systems).filter(f => f !== oldFolder);
    const newFolder = await ensureUniqueSlug(generateSlug(newName), existingFolders);

    if (newFolder === oldFolder) return;

    const oldPath = joinPath(this.vaultPath, oldFolder);
    const newPath = joinPath(this.vaultPath, newFolder);
    await renamePath(oldPath, newPath);

    // Update idMap: system
    this.idMap.systems[systemId] = newFolder;

    // Update idMap: child projects (oldFolder/projectSlug -> newFolder/projectSlug)
    for (const [projectId, projectPath] of Object.entries(this.idMap.projects)) {
      if (projectPath.startsWith(oldFolder + '/')) {
        this.idMap.projects[projectId] = newFolder + projectPath.slice(oldFolder.length);
      }
    }

    // Update idMap: child notes
    for (const [noteId, notePath] of Object.entries(this.idMap.notes)) {
      if (notePath.startsWith(oldFolder + '/')) {
        this.idMap.notes[noteId] = newFolder + notePath.slice(oldFolder.length);
      }
    }

    await this.saveIdMap();
  }

  /**
   * Rename a project folder on disk and update all child paths in the idMap.
   */
  async renameProject(projectId: string, newName: string): Promise<void> {
    const oldRelPath = this.idMap.projects[projectId];
    if (!oldRelPath) return;

    const parts = oldRelPath.split('/');
    const systemFolder = parts[0];
    const oldProjectFolder = parts[1];

    // Get existing sibling project folders for uniqueness check
    const siblingFolders = Object.values(this.idMap.projects)
      .filter(p => p.startsWith(systemFolder + '/') && p !== oldRelPath)
      .map(p => p.split('/')[1]);

    const newProjectFolder = await ensureUniqueSlug(generateSlug(newName), siblingFolders);

    if (newProjectFolder === oldProjectFolder) return;

    const oldPath = joinPath(this.vaultPath, oldRelPath);
    const newRelPath = `${systemFolder}/${newProjectFolder}`;
    const newPath = joinPath(this.vaultPath, newRelPath);
    await renamePath(oldPath, newPath);

    // Update idMap: project
    this.idMap.projects[projectId] = newRelPath;

    // Update idMap: child notes
    for (const [noteId, notePath] of Object.entries(this.idMap.notes)) {
      if (notePath.startsWith(oldRelPath + '/')) {
        this.idMap.notes[noteId] = newRelPath + notePath.slice(oldRelPath.length);
      }
    }

    await this.saveIdMap();
  }

  /**
   * Rename a note file on disk (and its visual sidecar if present).
   */
  async renameNote(noteId: string, newTitle: string): Promise<void> {
    const oldRelPath = this.idMap.notes[noteId];
    if (!oldRelPath) return;

    const dir = getDirname(oldRelPath);
    const oldFilename = getFilename(oldRelPath);
    const oldSlug = removeExtension(oldFilename);

    // Get existing sibling note files for uniqueness check
    const siblingFiles = Object.values(this.idMap.notes)
      .filter(p => getDirname(p) === dir && p !== oldRelPath)
      .map(p => removeExtension(getFilename(p)));

    const newSlug = await ensureUniqueSlug(generateSlug(newTitle || 'untitled'), siblingFiles);

    if (newSlug === oldSlug) return;

    const newFilename = newSlug + '.md';
    const newRelPath = dir ? `${dir}/${newFilename}` : newFilename;

    // Rename .md file
    const oldFullPath = joinPath(this.vaultPath, oldRelPath);
    const newFullPath = joinPath(this.vaultPath, newRelPath);
    await renamePath(oldFullPath, newFullPath);

    // Rename visual sidecar if it exists
    const oldSidecarPath = removeExtension(oldFullPath) + FILE_PATTERNS.VISUAL_SIDECAR_SUFFIX;
    if (await pathExists(oldSidecarPath)) {
      const newSidecarPath = removeExtension(newFullPath) + FILE_PATTERNS.VISUAL_SIDECAR_SUFFIX;
      await renamePath(oldSidecarPath, newSidecarPath);
    }

    // Update idMap
    this.idMap.notes[noteId] = newRelPath;
    await this.saveIdMap();
  }

  /**
   * Subscribe to external file changes
   */
  onExternalChange(callback: (event: ExternalChangeEvent) => void): () => void {
    this.changeListeners.add(callback);

    return () => {
      this.changeListeners.delete(callback);
    };
  }

  /**
   * Notify listeners of an external change (called by file watcher)
   */
  notifyChange(event: ExternalChangeEvent): void {
    for (const listener of this.changeListeners) {
      listener(event);
    }
  }
}

/**
 * Singleton instance for the filesystem adapter
 */
export const filesystemAdapter = new FilesystemAdapter();
