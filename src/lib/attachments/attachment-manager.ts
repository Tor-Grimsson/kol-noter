/**
 * Attachment Manager
 *
 * Handles attachments (images, files) for notes.
 * - In localStorage mode: stores as base64 data URLs in the note object
 * - In filesystem mode: writes actual files to assets/ folder
 */

import { isTauri, joinPath, pathExists, createDirectory, writeFile, readFile, removePath } from '@/lib/tauri-bridge';
import { getActiveAdapter, isUsingFilesystem } from '@/lib/persistence';
import { FILE_PATTERNS } from '@/lib/persistence/types';
import { filesystemAdapter } from '@/lib/persistence/filesystem-adapter';

/**
 * Attachment metadata
 */
export interface AttachmentInfo {
  filename: string;
  path: string;           // Relative path from note (e.g., "assets/image.png")
  absolutePath?: string;  // Full path on disk (filesystem mode only)
  mimeType?: string;
  size?: number;
  createdAt: number;
}

/**
 * Result of saving an attachment
 */
export interface SaveAttachmentResult {
  success: boolean;
  filename: string;
  path: string;           // Path to use in markdown (relative or data URL)
  error?: string;
}

/**
 * Generate a timestamp-based filename
 */
export function generateAttachmentFilename(originalName?: string, extension = 'png'): string {
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');

  if (originalName) {
    // Sanitize original name
    const sanitized = originalName
      .replace(/[^a-zA-Z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    return `${timestamp}-${sanitized}`;
  }

  return `Pasted-image-${timestamp}.${extension}`;
}

/**
 * Extract MIME type from data URL
 */
export function getMimeTypeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match ? match[1] : 'application/octet-stream';
}

/**
 * Extract extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/json': 'json',
  };
  return mimeToExt[mimeType] || 'bin';
}

/**
 * Decode base64 data URL to binary string
 */
export function decodeDataUrl(dataUrl: string): { data: string; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL format');
  }
  return {
    mimeType: match[1],
    data: atob(match[2]),
  };
}

/**
 * Convert binary string to Uint8Array
 */
export function binaryStringToUint8Array(binaryString: string): Uint8Array {
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * AttachmentManager class
 *
 * Provides methods to save, retrieve, and delete attachments
 */
export class AttachmentManager {
  /**
   * Save an attachment for a note
   *
   * @param noteId The note ID
   * @param data Base64 data URL or Blob
   * @param filename Optional filename (will generate if not provided)
   * @returns Result with path to use in markdown
   */
  async saveAttachment(
    noteId: string,
    data: string | Blob,
    filename?: string
  ): Promise<SaveAttachmentResult> {
    try {
      // Convert Blob to data URL if needed
      let dataUrl: string;
      if (data instanceof Blob) {
        dataUrl = await this.blobToDataUrl(data);
      } else {
        dataUrl = data;
      }

      const mimeType = getMimeTypeFromDataUrl(dataUrl);
      const extension = getExtensionFromMimeType(mimeType);
      const finalFilename = filename || generateAttachmentFilename(undefined, extension);

      if (isUsingFilesystem() && isTauri()) {
        return this.saveToFilesystem(noteId, dataUrl, finalFilename);
      } else {
        return this.saveToLocalStorage(noteId, dataUrl, finalFilename);
      }
    } catch (error) {
      return {
        success: false,
        filename: filename || 'unknown',
        path: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Save attachment to filesystem (Tauri mode)
   */
  private async saveToFilesystem(
    noteId: string,
    dataUrl: string,
    filename: string
  ): Promise<SaveAttachmentResult> {
    const vaultPath = filesystemAdapter.getVaultPath();
    if (!vaultPath) {
      throw new Error('Vault not initialized');
    }

    // Get the note's directory from the adapter
    const adapter = getActiveAdapter();

    // For now, we'll use a shared assets folder at project level
    // The filesystem adapter will handle the actual path resolution
    const relativePath = `${FILE_PATTERNS.ASSETS_DIR}/${filename}`;

    // Use the adapter to save the attachment
    await adapter.saveAttachment(noteId, filename, dataUrl);

    return {
      success: true,
      filename,
      path: relativePath,
    };
  }

  /**
   * Save attachment to localStorage (browser mode)
   */
  private async saveToLocalStorage(
    noteId: string,
    dataUrl: string,
    filename: string
  ): Promise<SaveAttachmentResult> {
    const adapter = getActiveAdapter();
    await adapter.saveAttachment(noteId, filename, dataUrl);

    // In localStorage mode, the path IS the data URL (stored in note.attachments)
    return {
      success: true,
      filename,
      path: filename, // Will be resolved to data URL when rendering
    };
  }

  /**
   * Get an attachment's data/URL
   *
   * @param noteId The note ID
   * @param filename The attachment filename
   * @returns Data URL or file path
   */
  async getAttachment(noteId: string, filename: string): Promise<string> {
    const adapter = getActiveAdapter();
    return adapter.getAttachment(noteId, filename);
  }

  /**
   * Delete an attachment
   *
   * @param noteId The note ID
   * @param filename The attachment filename
   */
  async deleteAttachment(noteId: string, filename: string): Promise<void> {
    const adapter = getActiveAdapter();
    await adapter.deleteAttachment(noteId, filename);
  }

  /**
   * Convert Blob to data URL
   */
  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Resolve an attachment path to a displayable URL
   *
   * In filesystem mode, converts relative path to absolute file:// URL
   * In localStorage mode, returns the data URL from note.attachments
   *
   * @param noteId The note ID
   * @param path The path from markdown (e.g., "assets/image.png" or just "filename.png")
   * @param attachments The note's attachments object (for localStorage lookup)
   */
  async resolveAttachmentUrl(
    noteId: string,
    path: string,
    attachments?: Record<string, string>
  ): Promise<string> {
    // Extract filename from path
    const filename = path.split('/').pop() || path;

    // Check localStorage attachments first
    if (attachments && attachments[filename]) {
      return attachments[filename];
    }

    // Try to load from adapter
    try {
      return await this.getAttachment(noteId, filename);
    } catch {
      // Return placeholder or original path
      return path;
    }
  }

  /**
   * Migrate base64 attachments from localStorage to filesystem
   *
   * @param noteId The note ID
   * @param attachments Map of filename -> base64 data URL
   * @returns Map of filename -> new relative path
   */
  async migrateAttachments(
    noteId: string,
    attachments: Record<string, string>
  ): Promise<Record<string, string>> {
    if (!isUsingFilesystem() || !isTauri()) {
      // No migration needed in localStorage mode
      return attachments;
    }

    const migratedPaths: Record<string, string> = {};

    for (const [filename, dataUrl] of Object.entries(attachments)) {
      if (dataUrl.startsWith('data:')) {
        // This is a base64 data URL that needs to be migrated
        const result = await this.saveAttachment(noteId, dataUrl, filename);
        if (result.success) {
          migratedPaths[filename] = result.path;
        }
      } else {
        // Already a path, keep as-is
        migratedPaths[filename] = dataUrl;
      }
    }

    return migratedPaths;
  }
}

/**
 * Singleton instance
 */
export const attachmentManager = new AttachmentManager();

/**
 * Parse Obsidian-style image syntax from content
 * Matches: ![[filename.png]] or ![[path/to/filename.png]]
 */
export function parseObsidianImages(content: string): string[] {
  const matches = content.match(/!\[\[([^\]]+)\]\]/g) || [];
  return matches.map(m => m.slice(3, -2)); // Remove ![[  and  ]]
}

/**
 * Parse standard markdown image syntax
 * Matches: ![alt](path) or ![alt](data:...)
 */
export function parseMarkdownImages(content: string): Array<{ alt: string; path: string }> {
  const matches = content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g);
  return Array.from(matches).map(m => ({
    alt: m[1],
    path: m[2],
  }));
}

/**
 * Replace Obsidian image syntax with resolved URLs for rendering
 */
export async function resolveImagesInContent(
  content: string,
  noteId: string,
  attachments?: Record<string, string>
): Promise<string> {
  const obsidianImages = parseObsidianImages(content);
  let resolvedContent = content;

  for (const imagePath of obsidianImages) {
    const url = await attachmentManager.resolveAttachmentUrl(noteId, imagePath, attachments);
    // Replace ![[path]] with ![](url) for standard markdown rendering
    resolvedContent = resolvedContent.replace(
      `![[${imagePath}]]`,
      `![](${url})`
    );
  }

  return resolvedContent;
}
