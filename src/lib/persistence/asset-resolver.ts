/**
 * Asset URL Resolver
 *
 * Resolves `![[filename]]` references to URLs the webview can render.
 * In filesystem mode, uses Tauri's `convertFileSrc()` to create
 * `http://asset.localhost/...` URLs that load directly from disk.
 */

import { convertFileSrc } from '@tauri-apps/api/core';
import { isTauri } from '@/lib/tauri-bridge';

/**
 * Resolve an asset filename to a renderable URL.
 *
 * @param noteAssetBasePath - Absolute path to the note's `_assets/` directory
 * @param filename - The asset filename (e.g. "pasted-image-123.png")
 * @returns A URL the webview `<img>` tag can load
 */
export function resolveAssetUrl(noteAssetBasePath: string, filename: string): string {
  const fullPath = `${noteAssetBasePath}/${filename}`;
  return convertFileSrc(fullPath);
}

/**
 * Build the absolute path to a note's `_assets/` directory.
 *
 * @param vaultPath - Absolute vault root path
 * @param noteRelativePath - Relative path from vault root to the .md file (from idMap)
 * @returns Absolute path to the note's `_assets/` directory
 */
export function getNoteAssetBasePath(vaultPath: string, noteRelativePath: string): string {
  // noteRelativePath is like "system-slug/project-slug/note-slug.md"
  // We need the directory containing the note, then append _assets
  const lastSlash = noteRelativePath.lastIndexOf('/');
  const noteDir = lastSlash >= 0 ? noteRelativePath.substring(0, lastSlash) : '';
  return `${vaultPath}/${noteDir}/_assets`;
}
