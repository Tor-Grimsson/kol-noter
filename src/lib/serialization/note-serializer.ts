/**
 * Note Serialization
 *
 * Converts notes to/from markdown files with YAML frontmatter.
 * Supports standard (markdown), modular (block), and visual (flowchart) editor types.
 */

import matter from 'gray-matter';
import slugify from 'slugify';
import type {
  Note,
  Page,
  Block,
  VisualNode,
  System,
  Project,
  EditorType,
  ItemMetrics,
} from '@/store/NotesContext';
import type {
  NoteFrontmatter,
  NoteMetadataFrontmatter,
  PageFrontmatter,
  SystemFrontmatter,
  ProjectFrontmatter,
} from '@/lib/persistence/types';

/**
 * Generate a URL-safe slug from a title
 */
export function generateSlug(title: string): string {
  const slug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });

  return slug || 'untitled';
}

/**
 * Ensure a slug is unique by appending a number if needed
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): Promise<string> {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let slug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(slug)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

/**
 * Parse ISO date string or timestamp to Date
 */
function parseDate(value: string | number | undefined): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return new Date(value).getTime();
  }
  return Date.now();
}

/**
 * Format timestamp to ISO string
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Note Serializer
 *
 * Handles serialization of all note types to/from markdown
 */
export class NoteSerializer {
  /**
   * Serialize a note to markdown with frontmatter
   * Returns both the markdown content and optional visual data (for sidecar file)
   */
  static serialize(note: Note): { markdown: string; visualData?: VisualNode[] } {
    const frontmatter: NoteFrontmatter = {
      id: note.id,
      editorType: note.editorType,
      created: formatDate(note.createdAt),
      updated: formatDate(note.updatedAt),
    };

    // Optional fields
    if (note.tags?.length) {
      frontmatter.tags = note.tags;
    }
    if (note.tagColors && Object.keys(note.tagColors).length) {
      frontmatter.tagColors = note.tagColors;
    }
    if (note.favorite) {
      frontmatter.favorite = note.favorite;
    }
    if (note.color) {
      frontmatter.color = note.color;
    }
    if (note.icon !== undefined) {
      frontmatter.icon = note.icon;
    }
    if (note.customType) {
      frontmatter.customType = note.customType;
    }
    if (note.metrics) {
      const m: Record<string, string> = {};
      if (note.metrics.health) m.health = note.metrics.health;
      if (note.metrics.priority) m.priority = note.metrics.priority;
      if (note.metrics.lead) m.lead = note.metrics.lead;
      if (note.metrics.targetDate) m.targetDate = note.metrics.targetDate;
      if (note.metrics.status) m.status = note.metrics.status;
      if (Object.keys(m).length) frontmatter.metrics = m;
    }

    // Serialize photos as filename list
    if (note.photos?.length) {
      frontmatter.photos = note.photos.map(p => p.name);
    }

    // Serialize file attachments (excluding photos) as filename list
    if (note.attachments) {
      const photoNames = new Set((note.photos || []).map(p => p.name));
      const fileNames = Object.keys(note.attachments).filter(f => !photoNames.has(f));
      if (fileNames.length) {
        frontmatter.files = fileNames;
      }
    }

    let content: string;
    let visualData: VisualNode[] | undefined;

    switch (note.editorType) {
      case 'standard':
        content = this.serializeStandardContent(note.content as string);
        break;

      case 'modular':
        content = this.serializeModularContent(note.content as Block[]);
        break;

      case 'visual':
        const result = this.serializeVisualContent(note.content as VisualNode[], note.title);
        content = result.markdown;
        visualData = result.visualData;
        break;

      default:
        content = '';
    }

    const markdown = matter.stringify(content, frontmatter as any);

    return { markdown, visualData };
  }

  /**
   * Convert a slug like `my-cool-note` to title case: `My Cool Note`.
   */
  private static deslugify(slug: string): string {
    return slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Deserialize markdown to a note
   * @param markdown The markdown file content
   * @param visualData Optional visual node data from sidecar file
   * @param filename Optional filename (without extension) used as title fallback
   */
  static deserialize(markdown: string, visualData?: VisualNode[], filename?: string): Note {
    const { data, content } = matter(markdown);
    const fm = data as NoteFrontmatter;

    const note: Note = {
      id: fm.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: '',
      preview: '',
      date: 'Just now',
      tags: fm.tags || [],
      tagColors: fm.tagColors,
      favorite: fm.favorite,
      color: fm.color,
      icon: fm.icon,
      customType: fm.customType,
      systemId: '', // Will be set by adapter
      projectId: '', // Will be set by adapter
      editorType: fm.editorType || 'standard',
      content: '',
      createdAt: parseDate(fm.created),
      updatedAt: parseDate(fm.updated),
    };

    // Parse metrics
    if (fm.metrics) {
      note.metrics = {
        health: fm.metrics.health as ItemMetrics['health'],
        priority: fm.metrics.priority as ItemMetrics['priority'],
        lead: fm.metrics.lead,
        targetDate: fm.metrics.targetDate,
        status: fm.metrics.status as ItemMetrics['status'],
      };
    }

    // Reconstruct photos from frontmatter filenames
    if (fm.photos?.length) {
      note.photos = fm.photos.map(name => ({
        id: name,
        name,
        dataUrl: '',  // resolved at render time via convertFileSrc
        addedAt: note.createdAt,
      }));
    }

    // Reconstruct file attachments from frontmatter filenames
    if (fm.files?.length) {
      note.attachments = {};
      for (const name of fm.files) {
        note.attachments[name] = '';  // resolved at render time via convertFileSrc
      }
    }

    // Parse content based on editor type
    switch (note.editorType) {
      case 'standard':
        note.content = content.trim();
        note.title = this.extractTitleFromMarkdown(content);
        if (note.title === 'Untitled' && filename) {
          note.title = this.deslugify(filename);
        }
        note.preview = this.extractPreviewFromMarkdown(content);
        break;

      case 'modular':
        note.content = this.deserializeModularContent(content);
        const blocks = note.content as Block[];
        const headingBlock = blocks.find(b => b.type === 'heading');
        note.title = headingBlock?.content || (filename ? this.deslugify(filename) : 'Untitled');
        const previewBlock = blocks.find(b => b.content && b.type !== 'section');
        note.preview = previewBlock?.content?.slice(0, 100) || '';
        break;

      case 'visual':
        note.content = visualData || [];
        const nodes = note.content as VisualNode[];
        const visualTitle = this.extractTitleFromMarkdown(content);
        note.title = (visualTitle && visualTitle !== 'Untitled')
          ? visualTitle
          : (filename ? this.deslugify(filename) : (nodes[0]?.label !== 'Start' ? nodes[0]?.label : 'Flowchart'));
        note.preview = `Flowchart with ${nodes.length} nodes`;
        break;
    }

    return note;
  }

  /**
   * Serialize standard (markdown) content
   */
  private static serializeStandardContent(content: string): string {
    return content || '';
  }

  /**
   * Serialize modular (block) content to markdown with markers
   */
  private static serializeModularContent(blocks: Block[]): string {
    if (!blocks?.length) {
      return '';
    }

    const lines: string[] = [];

    for (const block of blocks) {
      // Add block marker as HTML comment
      const markerParts = [block.type];
      if (block.metadata?.level) {
        markerParts.push(String(block.metadata.level));
      }
      if (block.metadata?.language) {
        markerParts.push(block.metadata.language);
      }
      if (block.metadata?.listType) {
        markerParts.push(block.metadata.listType);
      }

      lines.push(`<!-- block:${markerParts.join(':')}:${block.id} -->`);

      switch (block.type) {
        case 'heading':
          const level = block.metadata?.level || 1;
          lines.push(`${'#'.repeat(level)} ${block.content}`);
          break;

        case 'paragraph':
          lines.push(block.content);
          break;

        case 'code':
          const lang = block.metadata?.language || '';
          lines.push(`\`\`\`${lang}`);
          lines.push(block.content);
          lines.push('```');
          break;

        case 'list':
          const items = block.content.split('\n');
          const prefix = block.metadata?.listType === 'numbered' ? '1.' : '-';
          items.forEach(item => {
            lines.push(`${prefix} ${item}`);
          });
          break;

        case 'image':
          lines.push(`![](${block.content})`);
          break;

        case 'section':
          lines.push(`---`);
          lines.push(`**${block.content}**`);
          break;
      }

      lines.push('');
    }

    return lines.join('\n').trim();
  }

  /**
   * Deserialize modular content from markdown with markers
   */
  private static deserializeModularContent(markdown: string): Block[] {
    const blocks: Block[] = [];
    const lines = markdown.split('\n');

    let currentBlock: Partial<Block> | null = null;
    let contentLines: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';

    const finishBlock = () => {
      if (currentBlock && currentBlock.id && currentBlock.type) {
        let content = contentLines.join('\n').trim();

        // Clean up content based on type
        if (currentBlock.type === 'heading') {
          // Remove heading markers
          content = content.replace(/^#+\s*/, '');
        } else if (currentBlock.type === 'code') {
          // Remove code fences
          content = content.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
        } else if (currentBlock.type === 'list') {
          // Remove list markers
          content = content
            .split('\n')
            .map(line => line.replace(/^[-*]\s*|^\d+\.\s*/, ''))
            .join('\n');
        } else if (currentBlock.type === 'section') {
          // Remove section markers
          content = content.replace(/^---\n?\*\*/, '').replace(/\*\*$/, '');
        } else if (currentBlock.type === 'image') {
          // Extract image URL
          const match = content.match(/!\[.*?\]\((.*?)\)/);
          content = match ? match[1] : content;
        }

        blocks.push({
          id: currentBlock.id,
          type: currentBlock.type as Block['type'],
          content,
          metadata: currentBlock.metadata,
        });
      }
      currentBlock = null;
      contentLines = [];
    };

    for (const line of lines) {
      // Check for block marker
      const markerMatch = line.match(/^<!--\s*block:(\w+)(?::(\w+))?(?::(\w+))?(?::([^:]+))?\s*-->$/);

      if (markerMatch) {
        finishBlock();

        const [, type, param1, param2, blockId] = markerMatch;
        currentBlock = {
          id: blockId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: type as Block['type'],
          metadata: {},
        };

        // Parse type-specific metadata
        if (type === 'heading' && param1) {
          currentBlock.metadata!.level = parseInt(param1, 10);
        } else if (type === 'code' && param1) {
          currentBlock.metadata!.language = param1;
        } else if (type === 'list' && param1) {
          currentBlock.metadata!.listType = param1 as 'bullet' | 'numbered';
        }

        continue;
      }

      // Track code blocks
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        if (inCodeBlock) {
          codeLanguage = line.slice(3).trim();
        }
      }

      // Add line to current block content
      if (currentBlock) {
        contentLines.push(line);
      } else if (line.trim()) {
        // Content without marker - try to infer block type
        if (line.startsWith('#')) {
          currentBlock = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'heading',
            metadata: { level: (line.match(/^#+/) || ['#'])[0].length },
          };
          contentLines.push(line);
        } else if (line.startsWith('```')) {
          currentBlock = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'code',
            metadata: { language: line.slice(3).trim() },
          };
          inCodeBlock = true;
          contentLines.push(line);
        } else if (line.match(/^[-*]\s/) || line.match(/^\d+\.\s/)) {
          currentBlock = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'list',
            metadata: { listType: line.match(/^\d/) ? 'numbered' : 'bullet' },
          };
          contentLines.push(line);
        } else {
          currentBlock = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'paragraph',
          };
          contentLines.push(line);
        }
      }
    }

    finishBlock();

    return blocks;
  }

  /**
   * Serialize visual content
   * Returns markdown stub and visual data for sidecar file
   */
  private static serializeVisualContent(
    nodes: VisualNode[],
    title: string
  ): { markdown: string; visualData: VisualNode[] } {
    // Create a stub markdown file that Obsidian can read
    const lines = [
      `# ${title || 'Flowchart'}`,
      '',
      '> This is a visual note. Open in KOL Noter to edit the flowchart.',
      '',
      '## Nodes',
      '',
    ];

    // List nodes in markdown for readability
    for (const node of nodes) {
      lines.push(`- **${node.type}**: ${node.label}`);
    }

    return {
      markdown: lines.join('\n'),
      visualData: nodes,
    };
  }

  /**
   * Extract title from markdown content
   */
  private static extractTitleFromMarkdown(content: string): string {
    const match = content.match(/^#\s+(.+)$/m);
    if (!match) return 'Untitled';
    return match[1]
      .replace(/\*\*(.+?)\*\*/g, '$1')   // bold
      .replace(/\*(.+?)\*/g, '$1')        // italic
      .replace(/__(.+?)__/g, '$1')        // bold alt
      .replace(/_(.+?)_/g, '$1')          // italic alt
      .replace(/~~(.+?)~~/g, '$1')        // strikethrough
      .replace(/`(.+?)`/g, '$1')          // inline code
      .trim();
  }

  /**
   * Extract preview from markdown content
   */
  private static extractPreviewFromMarkdown(content: string): string {
    return content
      .replace(/^#+\s+/gm, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
      .slice(0, 100)
      .trim();
  }
}

// ── Shared content helpers (used by NoteSerializer, PageSerializer) ──────────

/**
 * Serialize standard (markdown) content
 */
export function serializeStandardContent(content: string): string {
  return content || '';
}

/**
 * Serialize modular (block) content to markdown with markers
 */
export function serializeModularContent(blocks: Block[]): string {
  if (!blocks?.length) {
    return '';
  }

  const lines: string[] = [];

  for (const block of blocks) {
    const markerParts = [block.type];
    if (block.metadata?.level) {
      markerParts.push(String(block.metadata.level));
    }
    if (block.metadata?.language) {
      markerParts.push(block.metadata.language);
    }
    if (block.metadata?.listType) {
      markerParts.push(block.metadata.listType);
    }

    lines.push(`<!-- block:${markerParts.join(':')}:${block.id} -->`);

    switch (block.type) {
      case 'heading':
        const level = block.metadata?.level || 1;
        lines.push(`${'#'.repeat(level)} ${block.content}`);
        break;

      case 'paragraph':
        lines.push(block.content);
        break;

      case 'code':
        const lang = block.metadata?.language || '';
        lines.push(`\`\`\`${lang}`);
        lines.push(block.content);
        lines.push('```');
        break;

      case 'list':
        const items = block.content.split('\n');
        const prefix = block.metadata?.listType === 'numbered' ? '1.' : '-';
        items.forEach(item => {
          lines.push(`${prefix} ${item}`);
        });
        break;

      case 'image':
        lines.push(`![](${block.content})`);
        break;

      case 'section':
        lines.push(`---`);
        lines.push(`**${block.content}**`);
        break;
    }

    lines.push('');
  }

  return lines.join('\n').trim();
}

/**
 * Deserialize modular content from markdown with markers
 */
export function deserializeModularContent(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.split('\n');

  let currentBlock: Partial<Block> | null = null;
  let contentLines: string[] = [];
  let inCodeBlock = false;

  const finishBlock = () => {
    if (currentBlock && currentBlock.id && currentBlock.type) {
      let content = contentLines.join('\n').trim();

      if (currentBlock.type === 'heading') {
        content = content.replace(/^#+\s*/, '');
      } else if (currentBlock.type === 'code') {
        content = content.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
      } else if (currentBlock.type === 'list') {
        content = content
          .split('\n')
          .map(line => line.replace(/^[-*]\s*|^\d+\.\s*/, ''))
          .join('\n');
      } else if (currentBlock.type === 'section') {
        content = content.replace(/^---\n?\*\*/, '').replace(/\*\*$/, '');
      } else if (currentBlock.type === 'image') {
        const match = content.match(/!\[.*?\]\((.*?)\)/);
        content = match ? match[1] : content;
      }

      blocks.push({
        id: currentBlock.id,
        type: currentBlock.type as Block['type'],
        content,
        metadata: currentBlock.metadata,
      });
    }
    currentBlock = null;
    contentLines = [];
  };

  for (const line of lines) {
    const markerMatch = line.match(/^<!--\s*block:(\w+)(?::(\w+))?(?::(\w+))?(?::([^:]+))?\s*-->$/);

    if (markerMatch) {
      finishBlock();

      const [, type, param1, param2, blockId] = markerMatch;
      currentBlock = {
        id: blockId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: type as Block['type'],
        metadata: {},
      };

      if (type === 'heading' && param1) {
        currentBlock.metadata!.level = parseInt(param1, 10);
      } else if (type === 'code' && param1) {
        currentBlock.metadata!.language = param1;
      } else if (type === 'list' && param1) {
        currentBlock.metadata!.listType = param1 as 'bullet' | 'numbered';
      }

      continue;
    }

    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    if (currentBlock) {
      contentLines.push(line);
    } else if (line.trim()) {
      if (line.startsWith('#')) {
        currentBlock = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'heading',
          metadata: { level: (line.match(/^#+/) || ['#'])[0].length },
        };
        contentLines.push(line);
      } else if (line.startsWith('```')) {
        currentBlock = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'code',
          metadata: { language: line.slice(3).trim() },
        };
        inCodeBlock = true;
        contentLines.push(line);
      } else if (line.match(/^[-*]\s/) || line.match(/^\d+\.\s/)) {
        currentBlock = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'list',
          metadata: { listType: line.match(/^\d/) ? 'numbered' : 'bullet' },
        };
        contentLines.push(line);
      } else {
        currentBlock = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'paragraph',
        };
        contentLines.push(line);
      }
    }
  }

  finishBlock();
  return blocks;
}

/**
 * Serialize visual content to markdown stub + sidecar data
 */
export function serializeVisualContent(
  nodes: VisualNode[],
  title: string
): { markdown: string; visualData: VisualNode[] } {
  const lines = [
    `# ${title || 'Flowchart'}`,
    '',
    '> This is a visual note. Open in KOL Noter to edit the flowchart.',
    '',
    '## Nodes',
    '',
  ];

  for (const node of nodes) {
    lines.push(`- **${node.type}**: ${node.label}`);
  }

  return {
    markdown: lines.join('\n'),
    visualData: nodes,
  };
}

/**
 * Extract title from markdown content
 */
export function extractTitleFromMarkdown(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (!match) return 'Untitled';
  return match[1]
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .trim();
}

/**
 * Extract preview from markdown content
 */
export function extractPreviewFromMarkdown(content: string): string {
  return content
    .replace(/^#+\s+/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .slice(0, 100)
    .trim();
}

/**
 * Convert a slug like `my-cool-note` to title case: `My Cool Note`.
 */
export function deslugify(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Serialize page content based on editor type.
 * Returns markdown body + optional visual sidecar data.
 */
export function serializeContentByType(
  editorType: EditorType,
  content: Block[] | string | VisualNode[],
  title: string,
): { body: string; visualData?: VisualNode[] } {
  switch (editorType) {
    case 'standard':
      return { body: serializeStandardContent(content as string) };
    case 'modular':
      return { body: serializeModularContent(content as Block[]) };
    case 'visual': {
      const result = serializeVisualContent(content as VisualNode[], title);
      return { body: result.markdown, visualData: result.visualData };
    }
    default:
      return { body: '' };
  }
}

/**
 * Deserialize page content based on editor type.
 * Returns the parsed content + derived title + preview.
 */
export function deserializeContentByType(
  editorType: EditorType,
  markdownBody: string,
  visualData?: VisualNode[],
  slugFallback?: string,
): { content: Block[] | string | VisualNode[]; title: string; preview: string } {
  switch (editorType) {
    case 'standard': {
      const content = markdownBody.trim();
      let title = extractTitleFromMarkdown(markdownBody);
      if (title === 'Untitled' && slugFallback) {
        title = deslugify(slugFallback);
      }
      const preview = extractPreviewFromMarkdown(markdownBody);
      return { content, title, preview };
    }
    case 'modular': {
      const blocks = deserializeModularContent(markdownBody);
      const headingBlock = blocks.find(b => b.type === 'heading');
      const title = headingBlock?.content || (slugFallback ? deslugify(slugFallback) : 'Untitled');
      const previewBlock = blocks.find(b => b.content && b.type !== 'section');
      const preview = previewBlock?.content?.slice(0, 100) || '';
      return { content: blocks, title, preview };
    }
    case 'visual': {
      const nodes = visualData || [];
      const extractedTitle = extractTitleFromMarkdown(markdownBody);
      const title = (extractedTitle && extractedTitle !== 'Untitled')
        ? extractedTitle
        : (slugFallback ? deslugify(slugFallback) : (nodes[0]?.label !== 'Start' ? nodes[0]?.label : 'Flowchart'));
      const preview = `Flowchart with ${nodes.length} nodes`;
      return { content: nodes, title, preview };
    }
    default:
      return { content: '', title: 'Untitled', preview: '' };
  }
}

// ── NoteMetadataSerializer (for _note.md in folder-based notes) ─────────────

/**
 * Serializes/deserializes the _note.md file that holds note-level metadata.
 * Follows the same pattern as SystemSerializer / ProjectSerializer.
 */
export class NoteMetadataSerializer {
  static serialize(note: Note): string {
    const frontmatter: NoteMetadataFrontmatter = {
      id: note.id,
      created: formatDate(note.createdAt),
      updated: formatDate(note.updatedAt),
    };

    if (note.tags?.length) frontmatter.tags = note.tags;
    if (note.tagColors && Object.keys(note.tagColors).length) {
      frontmatter.tagColors = note.tagColors;
    }
    if (note.favorite) frontmatter.favorite = note.favorite;
    if (note.color) frontmatter.color = note.color;
    if (note.icon !== undefined) frontmatter.icon = note.icon;
    if (note.customType) frontmatter.customType = note.customType;
    if (note.metrics) {
      frontmatter.metrics = {
        health: note.metrics.health,
        priority: note.metrics.priority,
        lead: note.metrics.lead,
        targetDate: note.metrics.targetDate,
        status: note.metrics.status,
      };
    }
    if (note.photos?.length) {
      frontmatter.photos = note.photos.map(p => p.name);
    }
    if (note.attachments) {
      const photoNames = new Set((note.photos || []).map(p => p.name));
      const fileNames = Object.keys(note.attachments).filter(f => !photoNames.has(f));
      if (fileNames.length) frontmatter.files = fileNames;
    }

    const content = [
      `# ${note.title}`,
      '',
      note.preview || '',
    ].filter(Boolean).join('\n');

    return matter.stringify(content, frontmatter as any);
  }

  static deserialize(markdown: string): Partial<Note> {
    const { data, content } = matter(markdown);
    const fm = data as NoteMetadataFrontmatter;

    const note: Partial<Note> = {
      id: fm.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tags: fm.tags || [],
      tagColors: fm.tagColors,
      favorite: fm.favorite,
      color: fm.color,
      icon: fm.icon,
      customType: fm.customType,
      createdAt: parseDate(fm.created),
      updatedAt: parseDate(fm.updated),
      pages: [],
    };

    // Parse metrics
    if (fm.metrics) {
      note.metrics = {
        health: fm.metrics.health as ItemMetrics['health'],
        priority: fm.metrics.priority as ItemMetrics['priority'],
        lead: fm.metrics.lead,
        targetDate: fm.metrics.targetDate,
        status: fm.metrics.status as ItemMetrics['status'],
      };
    }

    // Reconstruct photos from frontmatter filenames
    if (fm.photos?.length) {
      note.photos = fm.photos.map(name => ({
        id: name,
        name,
        dataUrl: '',
        addedAt: note.createdAt!,
      }));
    }

    // Reconstruct file attachments from frontmatter filenames
    if (fm.files?.length) {
      note.attachments = {};
      for (const name of fm.files) {
        note.attachments[name] = '';
      }
    }

    // Extract title from markdown body
    const titleMatch = content.match(/^#\s+(.+)$/m);
    note.title = titleMatch ? titleMatch[1].trim() : 'Untitled';

    return note;
  }
}

// ── PageSerializer (for individual page .md files) ──────────────────────────

/**
 * Serializes/deserializes page .md files within a note folder.
 * Reuses the shared content serialization helpers.
 */
export class PageSerializer {
  static serialize(page: Page, noteTitle: string): { markdown: string; visualData?: VisualNode[] } {
    const frontmatter: PageFrontmatter = {
      id: page.id,
      editorType: page.editorType,
      order: page.order,
      created: formatDate(page.createdAt),
      updated: formatDate(page.updatedAt),
    };

    const { body, visualData } = serializeContentByType(
      page.editorType,
      page.content,
      page.title || noteTitle,
    );

    const markdown = matter.stringify(body, frontmatter as any);
    return { markdown, visualData };
  }

  static deserialize(
    markdown: string,
    noteId: string,
    slug: string,
    visualData?: VisualNode[],
  ): Page {
    const { data, content } = matter(markdown);
    const fm = data as PageFrontmatter;

    const editorType: EditorType = fm.editorType || 'standard';
    const { content: parsedContent, title, preview } = deserializeContentByType(
      editorType,
      content,
      visualData,
      slug,
    );

    return {
      id: fm.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      noteId,
      slug,
      title,
      preview,
      order: fm.order ?? 0,
      editorType,
      content: parsedContent,
      createdAt: parseDate(fm.created),
      updatedAt: parseDate(fm.updated),
    };
  }
}

/**
 * System Serializer
 *
 * Handles serialization of system metadata to _system.md
 */
export class SystemSerializer {
  static serialize(system: System): string {
    const frontmatter: SystemFrontmatter = {
      id: system.id,
      name: system.name,
    };

    // Optional fields
    if (system.description) {
      frontmatter.description = system.description;
    }
    if (system.tags?.length) {
      frontmatter.tags = system.tags;
    }
    if (system.tagColors && Object.keys(system.tagColors).length) {
      frontmatter.tagColors = system.tagColors;
    }
    if (system.color) {
      frontmatter.color = system.color;
    }
    if (system.icon) {
      frontmatter.icon = system.icon;
    }
    if (system.metrics) {
      const m: Record<string, string> = {};
      if (system.metrics.health) m.health = system.metrics.health;
      if (system.metrics.priority) m.priority = system.metrics.priority;
      if (system.metrics.lead) m.lead = system.metrics.lead;
      if (system.metrics.targetDate) m.targetDate = system.metrics.targetDate;
      if (system.metrics.status) m.status = system.metrics.status;
      if (Object.keys(m).length) frontmatter.metrics = m;
    }
    if (system.createdAt) {
      frontmatter.created = formatDate(system.createdAt);
    }
    if (system.updatedAt) {
      frontmatter.updated = formatDate(system.updatedAt);
    }

    const content = [
      `# ${system.name}`,
      '',
      system.description || '',
      '',
      system.detailNotes || '',
    ].filter(Boolean).join('\n');

    return matter.stringify(content, frontmatter as any);
  }

  static deserialize(markdown: string): System {
    const { data, content } = matter(markdown);
    const fm = data as SystemFrontmatter;

    const system: System = {
      id: fm.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: fm.name || 'Untitled System',
      description: fm.description,
      tags: fm.tags,
      tagColors: fm.tagColors,
      color: fm.color,
      icon: fm.icon,
      projects: [], // Will be populated by adapter
      createdAt: parseDate(fm.created),
      updatedAt: parseDate(fm.updated),
    };

    // Parse metrics
    if (fm.metrics) {
      system.metrics = {
        health: fm.metrics.health as ItemMetrics['health'],
        priority: fm.metrics.priority as ItemMetrics['priority'],
        lead: fm.metrics.lead,
        targetDate: fm.metrics.targetDate,
        status: fm.metrics.status as ItemMetrics['status'],
      };
    }

    // Extract detail notes from content (after the title and description)
    const lines = content.split('\n');
    const detailStartIndex = lines.findIndex((line, i) =>
      i > 0 && line.trim() && !line.startsWith('#')
    );
    if (detailStartIndex > 0) {
      system.detailNotes = lines.slice(detailStartIndex).join('\n').trim();
    }

    return system;
  }
}

/**
 * Project Serializer
 *
 * Handles serialization of project metadata to _project.md
 */
export class ProjectSerializer {
  static serialize(project: Project): string {
    const frontmatter: ProjectFrontmatter = {
      id: project.id,
      name: project.name,
    };

    // Optional fields
    if (project.description) {
      frontmatter.description = project.description;
    }
    if (project.tags?.length) {
      frontmatter.tags = project.tags;
    }
    if (project.tagColors && Object.keys(project.tagColors).length) {
      frontmatter.tagColors = project.tagColors;
    }
    if (project.color) {
      frontmatter.color = project.color;
    }
    if (project.icon) {
      frontmatter.icon = project.icon;
    }
    if (project.metrics) {
      const m: Record<string, string> = {};
      if (project.metrics.health) m.health = project.metrics.health;
      if (project.metrics.priority) m.priority = project.metrics.priority;
      if (project.metrics.lead) m.lead = project.metrics.lead;
      if (project.metrics.targetDate) m.targetDate = project.metrics.targetDate;
      if (project.metrics.status) m.status = project.metrics.status;
      if (Object.keys(m).length) frontmatter.metrics = m;
    }
    if (project.createdAt) {
      frontmatter.created = formatDate(project.createdAt);
    }
    if (project.updatedAt) {
      frontmatter.updated = formatDate(project.updatedAt);
    }

    const content = [
      `# ${project.name}`,
      '',
      project.description || '',
      '',
      project.detailNotes || '',
    ].filter(Boolean).join('\n');

    return matter.stringify(content, frontmatter as any);
  }

  static deserialize(markdown: string): Project {
    const { data, content } = matter(markdown);
    const fm = data as ProjectFrontmatter;

    const project: Project = {
      id: fm.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: fm.name || 'Untitled Project',
      description: fm.description,
      tags: fm.tags,
      tagColors: fm.tagColors,
      color: fm.color,
      icon: fm.icon,
      createdAt: parseDate(fm.created),
      updatedAt: parseDate(fm.updated),
    };

    // Parse metrics
    if (fm.metrics) {
      project.metrics = {
        health: fm.metrics.health as ItemMetrics['health'],
        priority: fm.metrics.priority as ItemMetrics['priority'],
        lead: fm.metrics.lead,
        targetDate: fm.metrics.targetDate,
        status: fm.metrics.status as ItemMetrics['status'],
      };
    }

    // Extract detail notes from content
    const lines = content.split('\n');
    const detailStartIndex = lines.findIndex((line, i) =>
      i > 0 && line.trim() && !line.startsWith('#')
    );
    if (detailStartIndex > 0) {
      project.detailNotes = lines.slice(detailStartIndex).join('\n').trim();
    }

    return project;
  }
}
