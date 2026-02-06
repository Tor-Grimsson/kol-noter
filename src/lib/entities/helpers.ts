// Generic entity helpers for CRUD operations
// These helpers work across Note, Project, and System types

import {
  Attachment,
  Photo,
  VoiceRecording,
  SavedLink,
  Contact,
  ItemMetrics,
  Block,
  VisualNode,
} from '../dummy-data/types';

// ============== Photo Helpers ==============

/**
 * Add a photo to an entity (Note, Project, or System)
 */
export function addPhoto<T extends { photos?: Photo[] }>(
  entity: T,
  photo: Omit<Photo, 'id' | 'addedAt'>
): T {
  const newPhoto: Photo = {
    ...photo,
    id: crypto.randomUUID(),
    addedAt: Date.now(),
  };
  return {
    ...entity,
    photos: [...(entity.photos || []), newPhoto],
    updatedAt: Date.now(),
  };
}

/**
 * Remove a photo from an entity
 */
export function removePhoto<T extends { photos?: Photo[] }>(
  entity: T,
  photoId: string
): T {
  return {
    ...entity,
    photos: (entity.photos || []).filter(p => p.id !== photoId),
    updatedAt: Date.now(),
  };
}

// ============== Voice Recording Helpers ==============

/**
 * Add a voice recording to an entity
 */
export function addVoiceRecording<T extends { voiceRecordings?: VoiceRecording[] }>(
  entity: T,
  recording: Omit<VoiceRecording, 'id' | 'addedAt'>
): T {
  const newRec: VoiceRecording = {
    ...recording,
    id: crypto.randomUUID(),
    addedAt: Date.now(),
  };
  return {
    ...entity,
    voiceRecordings: [...(entity.voiceRecordings || []), newRec],
    updatedAt: Date.now(),
  };
}

/**
 * Remove a voice recording from an entity
 */
export function removeVoiceRecording<T extends { voiceRecordings?: VoiceRecording[] }>(
  entity: T,
  recordingId: string
): T {
  return {
    ...entity,
    voiceRecordings: (entity.voiceRecordings || []).filter(r => r.id !== recordingId),
    updatedAt: Date.now(),
  };
}

// ============== Link Helpers ==============

/**
 * Add a link to an entity
 */
export function addLink<T extends { links?: SavedLink[] }>(
  entity: T,
  link: Omit<SavedLink, 'id' | 'addedAt'>
): T {
  const newLink: SavedLink = {
    ...link,
    id: crypto.randomUUID(),
    addedAt: Date.now(),
  };
  return {
    ...entity,
    links: [...(entity.links || []), newLink],
    updatedAt: Date.now(),
  };
}

/**
 * Remove a link from an entity
 */
export function removeLink<T extends { links?: SavedLink[] }>(
  entity: T,
  linkId: string
): T {
  return {
    ...entity,
    links: (entity.links || []).filter(l => l.id !== linkId),
    updatedAt: Date.now(),
  };
}

/**
 * Update a link in an entity
 */
export function updateLink<T extends { links?: SavedLink[] }>(
  entity: T,
  linkId: string,
  updates: Partial<SavedLink>
): T {
  return {
    ...entity,
    links: (entity.links || []).map(l => l.id !== linkId ? l : { ...l, ...updates }),
    updatedAt: Date.now(),
  };
}

// ============== Contact Helpers ==============

/**
 * Add a contact to an entity
 */
export function addContact<T extends { contacts?: Contact[] }>(
  entity: T,
  contact: Omit<Contact, 'id'>
): T {
  const newContact: Contact = {
    ...contact,
    id: crypto.randomUUID(),
  };
  return {
    ...entity,
    contacts: [...(entity.contacts || []), newContact],
    updatedAt: Date.now(),
  };
}

/**
 * Remove a contact from an entity
 */
export function removeContact<T extends { contacts?: Contact[] }>(
  entity: T,
  contactId: string
): T {
  return {
    ...entity,
    contacts: (entity.contacts || []).filter(c => c.id !== contactId),
    updatedAt: Date.now(),
  };
}

/**
 * Update a contact in an entity
 */
export function updateContact<T extends { contacts?: Contact[] }>(
  entity: T,
  contactId: string,
  updates: Partial<Contact>
): T {
  return {
    ...entity,
    contacts: (entity.contacts || []).map(c => c.id !== contactId ? c : { ...c, ...updates }),
    updatedAt: Date.now(),
  };
}

// ============== Attachment Helpers ==============

/**
 * Add an attachment to an entity
 */
export function addAttachment<T extends { attachments?: Attachment[] }>(
  entity: T,
  attachment: Omit<Attachment, 'id' | 'createdAt'>
): T {
  const newAttachment: Attachment = {
    ...attachment,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  return {
    ...entity,
    attachments: [...(entity.attachments || []), newAttachment],
    updatedAt: Date.now(),
  };
}

/**
 * Remove an attachment from an entity
 */
export function removeAttachment<T extends { attachments?: Attachment[] }>(
  entity: T,
  attachmentId: string
): T {
  return {
    ...entity,
    attachments: (entity.attachments || []).filter(a => a.id !== attachmentId),
    updatedAt: Date.now(),
  };
}

// ============== Tag Helpers ==============

/**
 * Add a tag to an entity (lowercases the tag)
 */
export function addTag<T extends { tags?: string[] }>(
  entity: T,
  tag: string
): T {
  return {
    ...entity,
    tags: [...new Set([...(entity.tags || []), tag.toLowerCase()])],
    updatedAt: Date.now(),
  };
}

/**
 * Remove a tag from an entity
 */
export function removeTag<T extends { tags?: string[] }>(
  entity: T,
  tag: string
): T {
  return {
    ...entity,
    tags: (entity.tags || []).filter(t => t !== tag),
    updatedAt: Date.now(),
  };
}

/**
 * Update a tag color on an entity
 */
export function updateTagColor<T extends { tagColors?: Record<string, string> }>(
  entity: T,
  tagName: string,
  color: string
): T {
  return {
    ...entity,
    tagColors: {
      ...entity.tagColors,
      [tagName]: color,
    },
    updatedAt: Date.now(),
  };
}

/**
 * Rename a tag across both tags array and tagColors map
 */
export function renameTag<T extends { tags?: string[]; tagColors?: Record<string, string> }>(
  entity: T,
  oldTag: string,
  newTag: string
): T {
  const newTagLower = newTag.toLowerCase();
  const tags = (entity.tags || []).map(t => t === oldTag ? newTagLower : t);
  const tagColors = entity.tagColors ? { ...entity.tagColors } : {};

  if (tagColors[oldTag]) {
    tagColors[newTagLower] = tagColors[oldTag];
    delete tagColors[oldTag];
  }

  return {
    ...entity,
    tags: [...new Set(tags)],
    tagColors,
    updatedAt: Date.now(),
  };
}

// ============== Metrics Helpers ==============

/**
 * Update metrics on an entity (merges with existing metrics)
 */
export function updateMetrics<T extends { metrics?: ItemMetrics }>(
  entity: T,
  metrics: Partial<ItemMetrics>
): T {
  return {
    ...entity,
    metrics: {
      ...entity.metrics,
      ...metrics,
    },
    updatedAt: Date.now(),
  };
}

// ============== Detail Notes Helpers ==============

/**
 * Update detail notes on an entity
 */
export function updateDetailNotes<T extends { detailNotes?: string }>(
  entity: T,
  notes: string
): T {
  return {
    ...entity,
    detailNotes: notes,
    updatedAt: Date.now(),
  };
}

// ============== Color/Icon Helpers ==============

/**
 * Update color and/or icon on an entity
 */
export function updateColorIcon<T extends { color?: string; icon?: string }>(
  entity: T,
  updates: { color?: string; icon?: string }
): T {
  return {
    ...entity,
    ...(updates.color !== undefined && { color: updates.color }),
    ...(updates.icon !== undefined && { icon: updates.icon }),
    updatedAt: Date.now(),
  };
}

// ============== Metadata Helpers ==============

/**
 * Generic metadata update (updates any field except id)
 */
export function updateMetadata<T extends { updatedAt?: number }>(
  entity: T,
  updates: Partial<Omit<T, 'id'>>
): T {
  return {
    ...entity,
    ...updates,
    updatedAt: Date.now(),
  };
}
