// Tag helpers for extracting, managing, and aggregating tags

import { Block, Note, Project, System } from '../dummy-data/types';

// ============== Tag Extraction ==============

/**
 * Extract hashtags from a string content
 */
export function extractTagsFromString(content: string): string[] {
  const matches = content.match(/#(\w+)/g) || [];
  return [...new Set(matches.map(m => m.slice(1)))]; // Remove # prefix and deduplicate
}

/**
 * Extract tags from block content
 */
export function extractTagsFromBlocks(blocks: Block[]): string[] {
  const content = blocks.map(b => b.content || '').join(' ');
  return extractTagsFromString(content);
}

/**
 * Extract tags from note content (handles all content types)
 */
export function extractTagsFromNoteContent(note: Pick<Note, 'content'>): string[] {
  if (typeof note.content === 'string') {
    return extractTagsFromString(note.content);
  } else if (Array.isArray(note.content) && note.content.length > 0) {
    const first = note.content[0] as any;
    if (first?.type && ["heading", "paragraph", "code", "list", "image", "section"].includes(first.type)) {
      return extractTagsFromBlocks(note.content as Block[]);
    }
  }
  return [];
}

// ============== Tag Aggregation ==============

/**
 * Get tags from a single note (explicit + extracted)
 */
export function getNoteTags(note: Pick<Note, 'tags' | 'content'>): string[] {
  const explicitTags = note.tags || [];
  const extractedTags = extractTagsFromNoteContent(note);
  return [...new Set([...explicitTags, ...extractedTags])];
}

/**
 * Get all tags from a project (from project + all notes)
 */
export function getProjectTags(project: Pick<Project, 'tags'>, notes: Note[]): string[] {
  const tags: string[] = [...(project.tags || [])];

  for (const note of notes) {
    tags.push(...getNoteTags(note));
  }

  return [...new Set(tags)];
}

/**
 * Get all tags from a system (from system + projects + all notes)
 */
export function getSystemTags(system: Pick<System, 'tags' | 'projects'>, notes: Note[]): string[] {
  const tags: string[] = [...(system.tags || [])];

  // Add project tags
  for (const project of system.projects) {
    tags.push(...(project.tags || []));
  }

  // Add notes tags
  for (const note of notes) {
    tags.push(...getNoteTags(note));
  }

  return [...new Set(tags)];
}

/**
 * Get all tags from root level (all systems + projects + notes)
 */
export function getRootTags(systems: System[], notes: Note[]): string[] {
  const tags: string[] = [];

  for (const system of systems) {
    tags.push(...getSystemTags(system, notes.filter(n => n.systemId === system.id)));
  }

  return [...new Set(tags)];
}

// ============== Tag Color Management ==============

/**
 * Get the color for a specific tag from an entity
 */
export function getTagColor(
  entity: { tagColors?: Record<string, string> },
  tagName: string
): string | undefined {
  return entity.tagColors?.[tagName];
}

/**
 * Merge tag colors from one entity to another
 */
export function mergeTagColors(
  source: { tagColors?: Record<string, string> },
  target: { tagColors?: Record<string, string> }
): Record<string, string> {
  return {
    ...target.tagColors,
    ...source.tagColors,
  };
}
