import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/providers/WorkspaceProvider';

export type WorkspaceStore = {
  id: string;
  store_name: string;
  county: string;
  country?: string | null;
  store_lat: number;
  store_long: number;
  contact?: string | null;
};

const STORE_SELECT = 'id, store_name, county, country, store_lat, store_long, contact';

export function useWorkspaceStores() {
  const { currentWorkspaceId } = useWorkspace();
  const [stores, setStores] = useState<WorkspaceStore[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!currentWorkspaceId) {
      setStores([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [{ data, error }, { data: activeProject }] = await Promise.all([
        supabase
          .from('stores')
          .select(STORE_SELECT)
          .eq('workspace_id', currentWorkspaceId)
          .or('is_deleted.eq.false,is_deleted.is.null'),
        supabase
          .from('project_plans')
          .select('id, target_stores')
          .eq('workspace_id', currentWorkspaceId)
          .eq('status', 'active')
          .or('is_deleted.eq.false,is_deleted.is.null')
          .limit(1)
          .maybeSingle(),
      ]);

      if (error) {
        console.error('Error fetching stores:', error);
        setStores([]);
        return;
      }

      let merged: WorkspaceStore[] = (data as WorkspaceStore[] | null) ?? [];

      const rawTargets = activeProject?.target_stores;
      const targetIds: string[] = Array.isArray(rawTargets)
        ? rawTargets.filter((v): v is string => typeof v === 'string')
        : [];

      if (targetIds.length > 0) {
        const existingIds = new Set(merged.map((s) => s.id));
        const missingIds = targetIds.filter((id) => !existingIds.has(id));

        if (missingIds.length > 0) {
          const { data: extra, error: extraError } = await supabase
            .from('stores')
            .select(STORE_SELECT)
            .in('id', missingIds)
            .or('is_deleted.eq.false,is_deleted.is.null');

          if (extraError) {
            console.error('Error fetching target_stores extras:', extraError);
          } else if (extra && extra.length > 0) {
            merged = [...merged, ...(extra as WorkspaceStore[])];
          }
        }
      }

      const dedup = Array.from(new Map(merged.map((s) => [s.id, s])).values()).sort((a, b) =>
        a.store_name.localeCompare(b.store_name),
      );
      setStores(dedup);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stores, loading, refresh };
}
