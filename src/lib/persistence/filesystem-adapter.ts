/**
 * File System Persistence Adapter
 *
 * Implements IPersistenceAdapter using the native file system via Tauri.
 * Creates an Obsidian-compatible vault structure.
 */

import type { System, Note, Page, Project, Block, VisualNode } from '@/store/NotesContext';
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
  NoteMetadataSerializer,
  PageSerializer,
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
      // Notes are subdirectories; skip files, hidden dirs, metadata dirs
      if (
        !entry.isDirectory ||
        entry.name.startsWith('.') ||
        entry.name.startsWith('_')
      ) {
        continue;
      }

      const noteMetaPath = joinPath(entry.path, FILE_PATTERNS.NOTE_METADATA);

      // Must have _note.md to be a note folder
      if (!(await pathExists(noteMetaPath))) {
        continue;
      }

      try {
        // 1. Read _note.md → note metadata
        const metaContent = await readFile(noteMetaPath);
        const noteMeta = NoteMetadataSerializer.deserialize(metaContent);

        // 2. Read page .md files (everything except _note.md and _-prefixed)
        const noteEntries = await readDirectory(entry.path, false);
        const pages: Page[] = [];

        for (const pageEntry of noteEntries) {
          if (
            pageEntry.isDirectory ||
            pageEntry.name.startsWith('.') ||
            pageEntry.name.startsWith('_') ||
            pageEntry.name.endsWith(FILE_PATTERNS.VISUAL_SIDECAR_SUFFIX) ||
            !pageEntry.name.endsWith('.md')
          ) {
            continue;
          }

          try {
            const pageContent = await readFile(pageEntry.path);
            const pageSlug = removeExtension(pageEntry.name);

            // Check for visual sidecar
            const pageSidecarPath = removeExtension(pageEntry.path) + FILE_PATTERNS.VISUAL_SIDECAR_SUFFIX;
            let visualData: VisualNode[] | undefined;
            if (await pathExists(pageSidecarPath)) {
              const sidecarContent = await readFile(pageSidecarPath);
              visualData = JSON.parse(sidecarContent);
            }

            const page = PageSerializer.deserialize(
              pageContent,
              noteMeta.id!,
              pageSlug,
              visualData,
            );
            pages.push(page);
          } catch (e) {
            console.error(`Failed to load page from ${pageEntry.path}:`, e);
          }
        }

        // 3. Sort pages by order
        pages.sort((a, b) => a.order - b.order);

        // 4. Build the Note object
        const indexPage = pages.find(p => p.slug === 'index') || pages[0];

        const note: Note = {
          id: noteMeta.id!,
          title: noteMeta.title || (indexPage?.title) || entry.name,
          preview: indexPage?.preview || '',
          date: 'Just now',
          tags: noteMeta.tags || [],
          tagColors: noteMeta.tagColors,
          favorite: noteMeta.favorite,
          color: noteMeta.color,
          icon: noteMeta.icon,
          customType: noteMeta.customType,
          systemId,
          projectId,
          pages,
          // Deprecated fields — populated from index page for backward compat
          editorType: indexPage?.editorType || 'standard',
          content: indexPage?.content || '',
          createdAt: noteMeta.createdAt!,
          updatedAt: noteMeta.updatedAt!,
        };

        if (noteMeta.metrics) note.metrics = noteMeta.metrics;
        if (noteMeta.photos) note.photos = noteMeta.photos;
        if (noteMeta.attachments) note.attachments = noteMeta.attachments;

        // Update ID map — note path is the folder, not a file
        const relativePath = entry.path.replace(this.vaultPath + '/', '');
        this.idMap.notes[note.id] = relativePath;

        // 5. Scan _assets directory — discover files not already listed
        const assetsDir = joinPath(entry.path, FILE_PATTERNS.ASSETS_DIR);
        if (await pathExists(assetsDir)) {
          try {
            const assetEntries = await readDirectory(assetsDir, false);
            const filenames = assetEntries
              .filter(a => !a.isDirectory && !a.name.startsWith('.'))
              .map(a => a.name);

            const knownFiles = new Set<string>();
            if (note.photos) {
              for (const p of note.photos) knownFiles.add(p.name);
            }
            if (note.attachments) {
              for (const f of Object.keys(note.attachments)) knownFiles.add(f);
            }

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

    // Determine note folder name
    let existingRelPath = this.idMap.notes[note.id];
    let noteFolderName: string;

    if (existingRelPath) {
      // Existing note — folder name is the last segment of the relative path
      noteFolderName = existingRelPath.split('/').pop()!;
    } else {
      // New note — generate folder name
      const existingEntries = await readDirectory(projectFullPath, false);
      const existingFolders = existingEntries
        .filter(e => e.isDirectory && !e.name.startsWith('.') && !e.name.startsWith('_'))
        .map(e => e.name);

      noteFolderName = await ensureUniqueSlug(
        generateSlug(note.title || 'untitled'),
        existingFolders
      );
      this.idMap.notes[note.id] = `${projectPath}/${noteFolderName}`;
    }

    const noteFolderPath = joinPath(projectFullPath, noteFolderName);

    // Create note folder if it doesn't exist
    if (!(await pathExists(noteFolderPath))) {
      await createDirectory(noteFolderPath);
    }

    // 1. Write _note.md via NoteMetadataSerializer
    const noteMetaMd = NoteMetadataSerializer.serialize(note);
    await writeFile(joinPath(noteFolderPath, FILE_PATTERNS.NOTE_METADATA), noteMetaMd);

    // 2. Ensure pages exist — if empty, create a default index page from legacy fields
    const pages: Page[] = (note.pages && note.pages.length > 0)
      ? note.pages
      : [{
          id: `${note.id}-index`,
          noteId: note.id,
          slug: 'index',
          title: note.title,
          preview: note.preview || '',
          order: 0,
          editorType: note.editorType,
          content: note.content,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        }];

    // 3. Write each page as {slug}.md via PageSerializer
    const writtenSlugs = new Set<string>();
    for (const page of pages) {
      const { markdown, visualData } = PageSerializer.serialize(page, note.title);
      const pageFilePath = joinPath(noteFolderPath, `${page.slug}.md`);
      await writeFile(pageFilePath, markdown);
      writtenSlugs.add(page.slug);

      // Write .visual.json sidecar for visual pages
      if (visualData) {
        const sidecarPath = joinPath(noteFolderPath, `${page.slug}${FILE_PATTERNS.VISUAL_SIDECAR_SUFFIX}`);
        await writeFile(sidecarPath, JSON.stringify(visualData, null, 2));
      }
    }

    // 4. Delete orphaned .md files (pages that were removed)
    const noteEntries = await readDirectory(noteFolderPath, false);
    for (const entry of noteEntries) {
      if (
        entry.isDirectory ||
        entry.name.startsWith('.') ||
        entry.name.startsWith('_') ||
        !entry.name.endsWith('.md')
      ) {
        continue;
      }
      const slug = removeExtension(entry.name);
      if (!writtenSlugs.has(slug)) {
        await removePath(entry.path);
        // Also remove visual sidecar if present
        const orphanSidecar = removeExtension(entry.path) + FILE_PATTERNS.VISUAL_SIDECAR_SUFFIX;
        if (await pathExists(orphanSidecar)) {
          await removePath(orphanSidecar);
        }
      }
    }

    await this.saveIdMap();
  }

  async deleteNote(noteId: string): Promise<void> {
    const notePath = this.idMap.notes[noteId];
    if (!notePath) {
      return;
    }

    const fullPath = joinPath(this.vaultPath, notePath);

    // Read the note folder to save to trash as JSON snapshot
    if (await pathExists(fullPath)) {
      try {
        // Reload the note from disk so the trash snapshot is complete
        const parts = notePath.split('/');
        const systemFolder = parts[0];
        const systemId = Object.entries(this.idMap.systems).find(
          ([, path]) => path === systemFolder
        )?.[0] || '';
        const projectFolder = `${parts[0]}/${parts[1]}`;
        const projectId = Object.entries(this.idMap.projects).find(
          ([, path]) => path === projectFolder
        )?.[0] || '';

        const loadedNotes = await this.loadNotesFromDirectory(
          getDirname(fullPath),
          systemId,
          projectId
        );
        const note = loadedNotes.find(n => n.id === noteId);

        if (note) {
          const trashPath = joinPath(this.vaultPath, VAULT_CONFIG_DIR, 'trash');
          await createDirectory(trashPath);
          await writeFile(
            joinPath(trashPath, `${noteId}.json`),
            JSON.stringify(note, null, 2)
          );
        }
      } catch (e) {
        console.error('Failed to backup note to trash:', e);
      }

      // Remove the entire note folder
      await removePath(fullPath, true);
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

    // notePath is now a folder path (not a file), so _assets is a direct child
    const assetsDir = joinPath(this.vaultPath, notePath, FILE_PATTERNS.ASSETS_DIR);

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

    const filePath = joinPath(this.vaultPath, notePath, FILE_PATTERNS.ASSETS_DIR, filename);

    if (await pathExists(filePath)) {
      await removePath(filePath);
    }
  }

  async getAttachment(noteId: string, filename: string): Promise<string> {
    const notePath = this.idMap.notes[noteId];
    if (!notePath) {
      throw new Error(`Note ${noteId} not found`);
    }

    const filePath = joinPath(this.vaultPath, notePath, FILE_PATTERNS.ASSETS_DIR, filename);

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

    const noteFolderPath = joinPath(this.vaultPath, notePath);
    let totalSize = 0;

    if (!(await pathExists(noteFolderPath))) {
      return 0;
    }

    // Sum all files in the note folder (pages, _note.md, sidecars)
    const entries = await readDirectory(noteFolderPath, false);
    for (const entry of entries) {
      if (entry.isFile) {
        totalSize += await getFileSize(entry.path);
      }
    }

    // Sum _assets folder size
    const assetsDir = joinPath(noteFolderPath, FILE_PATTERNS.ASSETS_DIR);
    if (await pathExists(assetsDir)) {
      const assetEntries = await readDirectory(assetsDir, false);
      for (const entry of assetEntries) {
        if (entry.isFile) {
          totalSize += await getFileSize(entry.path);
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
   * Rename a note folder on disk and update idMap paths.
   */
  async renameNote(noteId: string, newTitle: string): Promise<void> {
    const oldRelPath = this.idMap.notes[noteId];
    if (!oldRelPath) return;

    const parentDir = getDirname(oldRelPath);
    const oldFolderName = oldRelPath.split('/').pop()!;

    // Get existing sibling note folders for uniqueness check
    const siblingFolders = Object.values(this.idMap.notes)
      .filter(p => getDirname(p) === parentDir && p !== oldRelPath)
      .map(p => p.split('/').pop()!);

    const newFolderName = await ensureUniqueSlug(generateSlug(newTitle || 'untitled'), siblingFolders);

    if (newFolderName === oldFolderName) return;

    const newRelPath = parentDir ? `${parentDir}/${newFolderName}` : newFolderName;

    // Rename the folder
    const oldFullPath = joinPath(this.vaultPath, oldRelPath);
    const newFullPath = joinPath(this.vaultPath, newRelPath);
    await renamePath(oldFullPath, newFullPath);

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
