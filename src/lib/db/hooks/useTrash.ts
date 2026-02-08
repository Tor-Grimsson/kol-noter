import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';
import { getDb } from '../client';
import { useVault } from '@/components/vault-system/VaultProvider';
import type { Note } from '@/lib/dummy-data/types';

interface TrashRow {
  id: string;
  note_json: string;
  deleted_at: number;
}

export function useTrash() {
  const { vaultPath } = useVault();

  return useQuery({
    queryKey: queryKeys.trash.all,
    queryFn: async (): Promise<Note[]> => {
      if (!vaultPath) return [];
      const db = await getDb(vaultPath);
      const rows = await db.select<TrashRow[]>(
        'SELECT * FROM trash ORDER BY deleted_at DESC'
      );
      return rows.map(r => JSON.parse(r.note_json) as Note);
    },
    enabled: !!vaultPath,
  });
}
