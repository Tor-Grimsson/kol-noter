/**
 * useAttachments Hook
 *
 * React hook for managing note attachments.
 * Handles saving, loading, and resolving attachment URLs.
 */

import { useCallback } from 'react';
import {
  attachmentManager,
  generateAttachmentFilename,
  resolveImagesInContent,
  type SaveAttachmentResult,
} from '@/lib/attachments';

export interface UseAttachmentsOptions {
  noteId: string;
  attachments?: Record<string, string>;
}

export interface UseAttachmentsReturn {
  /**
   * Save a pasted or dropped image
   */
  saveImage: (data: string | Blob, filename?: string) => Promise<SaveAttachmentResult>;

  /**
   * Save any attachment
   */
  saveAttachment: (data: string | Blob, filename: string) => Promise<SaveAttachmentResult>;

  /**
   * Get an attachment's URL for display
   */
  getAttachmentUrl: (filename: string) => Promise<string>;

  /**
   * Delete an attachment
   */
  deleteAttachment: (filename: string) => Promise<void>;

  /**
   * Resolve all image references in content for rendering
   */
  resolveImages: (content: string) => Promise<string>;

  /**
   * Generate a filename for a pasted image
   */
  generateFilename: (extension?: string) => string;
}

export function useAttachments({
  noteId,
  attachments,
}: UseAttachmentsOptions): UseAttachmentsReturn {
  const saveImage = useCallback(
    async (data: string | Blob, filename?: string): Promise<SaveAttachmentResult> => {
      return attachmentManager.saveAttachment(noteId, data, filename);
    },
    [noteId]
  );

  const saveAttachment = useCallback(
    async (data: string | Blob, filename: string): Promise<SaveAttachmentResult> => {
      return attachmentManager.saveAttachment(noteId, data, filename);
    },
    [noteId]
  );

  const getAttachmentUrl = useCallback(
    async (filename: string): Promise<string> => {
      return attachmentManager.resolveAttachmentUrl(noteId, filename, attachments);
    },
    [noteId, attachments]
  );

  const deleteAttachment = useCallback(
    async (filename: string): Promise<void> => {
      return attachmentManager.deleteAttachment(noteId, filename);
    },
    [noteId]
  );

  const resolveImages = useCallback(
    async (content: string): Promise<string> => {
      return resolveImagesInContent(content, noteId, attachments);
    },
    [noteId, attachments]
  );

  const generateFilename = useCallback((extension = 'png'): string => {
    return generateAttachmentFilename(undefined, extension);
  }, []);

  return {
    saveImage,
    saveAttachment,
    getAttachmentUrl,
    deleteAttachment,
    resolveImages,
    generateFilename,
  };
}
