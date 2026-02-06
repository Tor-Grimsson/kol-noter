/**
 * Tauri Bridge - TypeScript interface to Tauri native APIs
 *
 * Provides unified access to file system, dialogs, and other native features.
 * Falls back to localStorage/browser APIs when running in non-Tauri environment.
 */

// Tauri v2 plugin imports
import {
  readTextFile,
  writeTextFile,
  readFile as readBinaryFile,
  writeFile as writeBinaryFile,
  readDir,
  mkdir,
  remove,
  rename,
  exists,
  copyFile,
  stat,
  BaseDirectory,
  type ReadDirOptions,
  type FileStats
} from '@tauri-apps/plugin-fs';
import { open as openDialog, save, message, ask } from '@tauri-apps/plugin-dialog';
import { documentDir, homeDir, appDataDir } from '@tauri-apps/api/path';

// Check if we're running in Tauri
// Tauri v2 uses __TAURI_INTERNALS__ instead of __TAURI__
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' &&
    ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);
};

// Vault configuration
export interface VaultConfig {
  vaultPath: string;
  lastOpened: number;
}

const CONFIG_KEY = 'kol-noter-vault-config';

/**
 * Get stored vault configuration from localStorage
 */
export function getStoredVaultConfig(): VaultConfig | null {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Store vault configuration to localStorage
 */
export function storeVaultConfig(config: VaultConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

/**
 * Clear stored vault configuration
 */
export function clearVaultConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
}

// File System Operations

/**
 * Read a text file from the vault
 */
export async function readFile(path: string): Promise<string> {
  if (!isTauri()) {
    throw new Error('File system access requires Tauri');
  }
  return readTextFile(path);
}

/**
 * Write a text file to the vault
 */
export async function writeFile(path: string, content: string): Promise<void> {
  if (!isTauri()) {
    throw new Error('File system access requires Tauri');
  }
  await writeTextFile(path, content);
}

/**
 * Write a binary file to the vault
 */
export async function writeBinary(path: string, data: Uint8Array): Promise<void> {
  if (!isTauri()) {
    throw new Error('File system access requires Tauri');
  }
  await writeBinaryFile(path, data);
}

/**
 * Read a binary file from the vault
 */
export async function readBinary(path: string): Promise<Uint8Array> {
  if (!isTauri()) {
    throw new Error('File system access requires Tauri');
  }
  return readBinaryFile(path);
}

/**
 * Get the size of a file in bytes
 */
export async function getFileSize(path: string): Promise<number> {
  if (!isTauri()) {
    throw new Error('File system access requires Tauri');
  }

  const stats = await stat(path);
  return stats.size;
}

/**
 * Write a data URL (base64 encoded) as binary file
 */
export async function writeDataUrlAsFile(path: string, dataUrl: string): Promise<void> {
  if (!isTauri()) {
    throw new Error('File system access requires Tauri');
  }

  // Parse data URL: data:mime/type;base64,<data>
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL format');
  }

  const base64Data = match[2];

  // Decode base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  await writeBinaryFile(path, bytes);
}

/**
 * Read a binary file and return as data URL
 */
export async function readFileAsDataUrl(path: string, mimeType: string): Promise<string> {
  if (!isTauri()) {
    throw new Error('File system access requires Tauri');
  }

  const bytes = await readBinaryFile(path);

  // Convert to base64
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return `data:${mimeType};base64,${base64}`;
}

/**
 * Check if a path exists
 */
export async function pathExists(path: string): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }
  try {
    return await exists(path);
  } catch {
    return false;
  }
}

/**
 * Create a directory (recursive)
 */
export async function createDirectory(path: string): Promise<void> {
  if (!isTauri()) {
    throw new Error('File system access requires Tauri');
  }
  await mkdir(path, { recursive: true });
}

/**
 * Remove a file or directory
 */
export async function removePath(path: string, recursive = false): Promise<void> {
  if (!isTauri()) {
    throw new Error('File system access requires Tauri');
  }
  await remove(path, { recursive });
}

/**
 * Rename/move a file or directory
 */
export async function renamePath(oldPath: string, newPath: string): Promise<void> {
  if (!isTauri()) {
    throw new Error('File system access requires Tauri');
  }
  await rename(oldPath, newPath);
}

/**
 * Copy a file
 */
export async function copyFilePath(source: string, destination: string): Promise<void> {
  if (!isTauri()) {
    throw new Error('File system access requires Tauri');
  }
  await copyFile(source, destination);
}

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  children?: FileEntry[];
}

/**
 * Read directory contents
 *
 * Note: Tauri v2 FS plugin API has changed significantly.
 * We handle the API differences based on the available interface.
 */
export async function readDirectory(path: string, recursive = false): Promise<FileEntry[]> {
  if (!isTauri()) {
    throw new Error('File system access requires Tauri');
  }

  try {
    // Tauri v2 API: readDir(path, options)
    // The options may have different structures based on the plugin version
    let entries: any[];

    try {
      // Try the newer Tauri v2 API with explicit options
      const options: ReadDirOptions = { recursive };
      entries = await readDir(path, options);
    } catch {
      // Fallback: try calling with path first argument only
      // Some versions of tauri-plugin-fs v2 use this signature
      entries = await (readDir as any)(path);
    }

    // Transform Tauri's DirEntry to our FileEntry format
    const transformEntry = (entry: any): FileEntry => ({
      name: entry.name || '',
      path: entry.path,
      isDirectory: entry.isDirectory || false,
      isFile: entry.isFile || !entry.isDirectory,
      children: recursive && entry.children ? entry.children.map(transformEntry) : undefined
    });

    return entries.map(transformEntry);
  } catch (error) {
    console.warn('readDirectory failed, returning empty:', error);
    return [];
  }
}

// Dialog Operations

export interface FolderPickerOptions {
  title?: string;
  defaultPath?: string;
}

/**
 * Open folder picker dialog to select vault location
 */
export async function pickVaultFolder(options: FolderPickerOptions = {}): Promise<string | null> {
  if (!isTauri()) {
    throw new Error('Dialog access requires Tauri');
  }

  const defaultPath = options.defaultPath || await documentDir();

  const selected = await openDialog({
    directory: true,
    multiple: false,
    title: options.title || 'Select KOL Noter Vault Folder',
    defaultPath
  });

  return selected as string | null;
}

export interface SaveFileOptions {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}

/**
 * Open save file dialog
 */
export async function saveFileDialog(options: SaveFileOptions = {}): Promise<string | null> {
  if (!isTauri()) {
    throw new Error('Dialog access requires Tauri');
  }

  const result = await save({
    title: options.title || 'Save File',
    defaultPath: options.defaultPath,
    filters: options.filters
  });

  return result;
}

/**
 * Show a message dialog
 */
export async function showMessage(title: string, content: string, kind: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
  if (!isTauri()) {
    alert(`${title}\n\n${content}`);
    return;
  }
  await message(content, { title, kind });
}

/**
 * Show a confirmation dialog
 */
export async function showConfirmation(title: string, content: string): Promise<boolean> {
  if (!isTauri()) {
    return confirm(`${title}\n\n${content}`);
  }
  return ask(content, { title });
}

// Path Utilities

/**
 * Get the user's Documents directory
 */
export async function getDocumentsDir(): Promise<string> {
  if (!isTauri()) {
    throw new Error('Path access requires Tauri');
  }
  return documentDir();
}

/**
 * Get the user's home directory
 */
export async function getHomeDir(): Promise<string> {
  if (!isTauri()) {
    throw new Error('Path access requires Tauri');
  }
  return homeDir();
}

/**
 * Get the app data directory
 */
export async function getAppDataDir(): Promise<string> {
  if (!isTauri()) {
    throw new Error('Path access requires Tauri');
  }
  return appDataDir();
}

/**
 * Join path segments
 */
export function joinPath(...segments: string[]): string {
  return segments.join('/').replace(/\/+/g, '/');
}

/**
 * Get the filename from a path
 */
export function getFilename(path: string): string {
  return path.split('/').pop() || '';
}

/**
 * Get the directory from a path
 */
export function getDirname(path: string): string {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/') || '/';
}

/**
 * Get the file extension
 */
export function getExtension(path: string): string {
  const filename = getFilename(path);
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.slice(lastDot) : '';
}

/**
 * Remove extension from filename
 */
export function removeExtension(path: string): string {
  const ext = getExtension(path);
  return ext ? path.slice(0, -ext.length) : path;
}

// Vault structure helpers

export const VAULT_CONFIG_DIR = '.kol-noter';
export const VAULT_CONFIG_FILE = 'config.json';
export const VAULT_ID_MAP_FILE = 'id-map.json';
export const VAULT_SEARCH_INDEX_FILE = 'search-index.json';

export interface VaultMetadata {
  version: string;
  created: number;
  lastModified: number;
}

/**
 * Initialize a vault at the given path
 */
export async function initializeVault(vaultPath: string): Promise<void> {
  if (!isTauri()) {
    throw new Error('Vault initialization requires Tauri');
  }

  const configDir = joinPath(vaultPath, VAULT_CONFIG_DIR);

  // Create config directory
  await createDirectory(configDir);

  // Create vault metadata
  const metadata: VaultMetadata = {
    version: '1.0.0',
    created: Date.now(),
    lastModified: Date.now()
  };

  await writeFile(
    joinPath(configDir, VAULT_CONFIG_FILE),
    JSON.stringify(metadata, null, 2)
  );

  // Create empty ID map with proper structure
  await writeFile(
    joinPath(configDir, VAULT_ID_MAP_FILE),
    JSON.stringify({ notes: {}, systems: {}, projects: {} }, null, 2)
  );
}

/**
 * Check if a path is a valid KOL Noter vault
 */
export async function isValidVault(vaultPath: string): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  const configPath = joinPath(vaultPath, VAULT_CONFIG_DIR, VAULT_CONFIG_FILE);

  try {
    return await pathExists(configPath);
  } catch {
    return false;
  }
}

/**
 * Get default vault path
 */
export async function getDefaultVaultPath(): Promise<string> {
  if (!isTauri()) {
    return '';
  }
  const docs = await documentDir();
  return joinPath(docs, 'KOL-Noter-Vault');
}
