import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';
import { getDb } from '../client';
import { useVault } from '@/components/vault-system/VaultProvider';
import type { Note } from '@/lib/dummy-data/types';

interface NoteRow {
  id: string;
  system_id: string;
  project_id: string;
  title: string;
  preview: string;
  date: string | null;
  editor_type: string;
  content_json: string | null;
  favorite: number;
  color: string | null;
  icon: string | null;
  cover_photo_id: string | null;
  custom_type: string | null;
  custom_field1: string | null;
  custom_field2: string | null;
  custom_field3: string | null;
  detail_notes: string | null;
  tags_json: string;
  tag_colors_json: string;
  attachments_json: string;
  photos_json: string;
  voice_recordings_json: string;
  links_json: string;
  contacts_json: string;
  metrics_json: string | null;
  created_at: number;
  updated_at: number;
}

export function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    systemId: row.system_id,
    projectId: row.project_id,
    title: row.title,
    preview: row.preview ?? '',
    date: row.date ?? '',
    editorType: row.editor_type as Note['editorType'],
    content: row.content_json ? JSON.parse(row.content_json) : '',
    favorite: row.favorite === 1,
    color: row.color ?? undefined,
    icon: row.icon,
    coverPhotoId: row.cover_photo_id ?? undefined,
    customType: row.custom_type ?? undefined,
    customField1: row.custom_field1 ?? undefined,
    customField2: row.custom_field2 ?? undefined,
    customField3: row.custom_field3 ?? undefined,
    detailNotes: row.detail_notes ?? undefined,
    tags: JSON.parse(row.tags_json),
    tagColors: JSON.parse(row.tag_colors_json),
    attachments: JSON.parse(row.attachments_json),
    photos: JSON.parse(row.photos_json),
    voiceRecordings: JSON.parse(row.voice_recordings_json),
    links: JSON.parse(row.links_json),
    contacts: JSON.parse(row.contacts_json),
    metrics: row.metrics_json ? JSON.parse(row.metrics_json) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useNotes() {
  const { vaultPath } = useVault();

  return useQuery({
    queryKey: queryKeys.notes.all,
    queryFn: async (): Promise<Note[]> => {
      if (!vaultPath) return [];
      const db = await getDb(vaultPath);
      const rows = await db.select<NoteRow[]>('SELECT * FROM notes ORDER BY updated_at DESC');
      return rows.map(rowToNote);
    },
    enabled: !!vaultPath,
  });
}

export function useNote(id: string | undefined) {
  const { vaultPath } = useVault();

  return useQuery({
    queryKey: queryKeys.notes.detail(id ?? ''),
    queryFn: async (): Promise<Note | undefined> => {
      if (!vaultPath || !id) return undefined;
      const db = await getDb(vaultPath);
      const rows = await db.select<NoteRow[]>('SELECT * FROM notes WHERE id=?', [id]);
      return rows.length > 0 ? rowToNote(rows[0]) : undefined;
    },
    enabled: !!vaultPath && !!id,
  });
}

export function useNotesByProject(systemId: string | undefined, projectId: string | undefined) {
  const { vaultPath } = useVault();

  return useQuery({
    queryKey: queryKeys.notes.byProject(systemId ?? '', projectId ?? ''),
    queryFn: async (): Promise<Note[]> => {
      if (!vaultPath || !systemId || !projectId) return [];
      const db = await getDb(vaultPath);
      const rows = await db.select<NoteRow[]>(
        'SELECT * FROM notes WHERE system_id=? AND project_id=? ORDER BY updated_at DESC',
        [systemId, projectId]
      );
      return rows.map(rowToNote);
    },
    enabled: !!vaultPath && !!systemId && !!projectId,
  });
}

export function useNotesBySystem(systemId: string | undefined) {
  const { vaultPath } = useVault();

  return useQuery({
    queryKey: queryKeys.notes.bySystem(systemId ?? ''),
    queryFn: async (): Promise<Note[]> => {
      if (!vaultPath || !systemId) return [];
      const db = await getDb(vaultPath);
      const rows = await db.select<NoteRow[]>(
        'SELECT * FROM notes WHERE system_id=? ORDER BY updated_at DESC',
        [systemId]
      );
      return rows.map(rowToNote);
    },
    enabled: !!vaultPath && !!systemId,
  });
}
