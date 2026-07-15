import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner, ListItemCard, AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function RankingsScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [ranks, setRanks] = useState<{ agent_id: string; current_rank: string | null; total_points: number | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      let query = supabase
        .from('agent_ranks')
        .select('agent_id, current_rank, total_points')
        .order('total_points', { ascending: false })
        .limit(20);

      if (currentWorkspaceId) {
        query = query.eq('workspace_id', currentWorkspaceId);
      }

      const { data } = await query;
      setRanks(data ?? []);
      setLoading(false);
    };
    load();
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0122">
      <Screen scroll title="Rankings">
        {loading ? (
          <LoadingSpinner />
        ) : (
          ranks.map((r, i) => (
            <ListItemCard
              key={r.agent_id}
              title={r.current_rank ?? 'Agent'}
              subtitle={`${r.total_points ?? 0} pts`}
              trailing={
                <AppText variant="h3" style={{ color: colors.primary, marginRight: spacing.sm }}>
                  #{i + 1}
                </AppText>
              }
            />
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
