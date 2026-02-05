/**
 * Attachments Module
 *
 * Handles image and file attachments for notes.
 */

export {
  AttachmentManager,
  attachmentManager,
  generateAttachmentFilename,
  getMimeTypeFromDataUrl,
  getExtensionFromMimeType,
  decodeDataUrl,
  binaryStringToUint8Array,
  parseObsidianImages,
  parseMarkdownImages,
  resolveImagesInContent,
  type AttachmentInfo,
  type SaveAttachmentResult,
} from './attachment-manager';
