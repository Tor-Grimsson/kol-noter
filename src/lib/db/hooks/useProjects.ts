import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';
import { getDb } from '../client';
import { useVault } from '@/components/vault-system/VaultProvider';
import type { Project } from '@/lib/dummy-data/types';

interface ProjectRow {
  id: string;
  system_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  detail_notes: string | null;
  custom_field1: string | null;
  custom_field2: string | null;
  custom_field3: string | null;
  tags_json: string;
  tag_colors_json: string;
  photos_json: string;
  voice_recordings_json: string;
  links_json: string;
  contacts_json: string;
  attachments_json: string;
  metrics_json: string | null;
  created_at: number | null;
  updated_at: number | null;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    color: row.color ?? undefined,
    icon: row.icon ?? undefined,
    detailNotes: row.detail_notes ?? undefined,
    customField1: row.custom_field1 ?? undefined,
    customField2: row.custom_field2 ?? undefined,
    customField3: row.custom_field3 ?? undefined,
    tags: JSON.parse(row.tags_json),
    tagColors: JSON.parse(row.tag_colors_json),
    photos: JSON.parse(row.photos_json),
    voiceRecordings: JSON.parse(row.voice_recordings_json),
    links: JSON.parse(row.links_json),
    contacts: JSON.parse(row.contacts_json),
    attachments: JSON.parse(row.attachments_json),
    metrics: row.metrics_json ? JSON.parse(row.metrics_json) : undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export function useProjects(systemId: string | undefined) {
  const { vaultPath } = useVault();

  return useQuery({
    queryKey: queryKeys.projects.bySystem(systemId ?? ''),
    queryFn: async (): Promise<Project[]> => {
      if (!vaultPath || !systemId) return [];
      const db = await getDb(vaultPath);
      const rows = await db.select<ProjectRow[]>(
        'SELECT * FROM projects WHERE system_id=?',
        [systemId]
      );
      return rows.map(rowToProject);
    },
    enabled: !!vaultPath && !!systemId,
  });
}

export function useProject(systemId: string | undefined, projectId: string | undefined) {
  const { vaultPath } = useVault();

  return useQuery({
    queryKey: queryKeys.projects.detail(systemId ?? '', projectId ?? ''),
    queryFn: async (): Promise<Project | undefined> => {
      if (!vaultPath || !systemId || !projectId) return undefined;
      const db = await getDb(vaultPath);
      const rows = await db.select<ProjectRow[]>(
        'SELECT * FROM projects WHERE id=? AND system_id=?',
        [projectId, systemId]
      );
      return rows.length > 0 ? rowToProject(rows[0]) : undefined;
    },
    enabled: !!vaultPath && !!systemId && !!projectId,
  });
}
