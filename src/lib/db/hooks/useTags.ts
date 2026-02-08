import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';
import { getDb } from '../client';
import { useVault } from '@/components/vault-system/VaultProvider';

interface TagRow {
  tag: string;
}

export function useAggregatedTags(level: 'project' | 'system' | 'root', id?: string) {
  const { vaultPath } = useVault();

  return useQuery({
    queryKey: queryKeys.tags.aggregated(level, id),
    queryFn: async (): Promise<string[]> => {
      if (!vaultPath) return [];
      const db = await getDb(vaultPath);

      let rows: TagRow[];

      switch (level) {
        case 'project': {
          if (!id) return [];
          // Tags from notes in the project + project's own tags
          rows = await db.select<TagRow[]>(
            `SELECT DISTINCT tag FROM entity_tags
             WHERE (entity_type='note' AND entity_id IN (SELECT id FROM notes WHERE project_id=?))
                OR (entity_type='project' AND entity_id=?)`,
            [id, id]
          );
          break;
        }
        case 'system': {
          if (!id) return [];
          rows = await db.select<TagRow[]>(
            `SELECT DISTINCT tag FROM entity_tags
             WHERE (entity_type='note' AND entity_id IN (SELECT id FROM notes WHERE system_id=?))
                OR (entity_type='project' AND entity_id IN (SELECT id FROM projects WHERE system_id=?))
                OR (entity_type='system' AND entity_id=?)`,
            [id, id, id]
          );
          break;
        }
        case 'root':
        default: {
          rows = await db.select<TagRow[]>(
            `SELECT DISTINCT tag FROM entity_tags`
          );
          break;
        }
      }

      return rows.map(r => r.tag);
    },
    enabled: !!vaultPath,
  });
}
