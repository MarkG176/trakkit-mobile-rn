import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner, ListItemCard, AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

type RankRow = {
  agent_id: string;
  current_rank: string | null;
  total_points: number | null;
};

export default function RankingsScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [ranks, setRanks] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentWorkspaceId) {
        setRanks([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from('agent_ranks')
        .select('agent_id, current_rank, total_points')
        .eq('workspace_id', currentWorkspaceId)
        .order('total_points', { ascending: false })
        .limit(20);

      setRanks(data ?? []);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`supervisor-rankings-${currentWorkspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_ranks',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        () => {
          load();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0122">
      <Screen scroll showBack>
        {loading ? (
          <LoadingSpinner label="Loading rankings" />
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
