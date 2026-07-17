import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner, ListItemCard, AppText } from '@/components/ui';
import { colors } from '@/theme';

export default function StatsScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [salesCount, setSalesCount] = useState(0);
  const [giveawayCount, setGiveawayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspaceId) return;

    const load = async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [sales, giveaways] = await Promise.all([
        supabase
          .from('sale_items')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', startOfDay.toISOString()),
        supabase
          .from('giveaways')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', startOfDay.toISOString()),
      ]);

      setSalesCount(sales.count ?? 0);
      setGiveawayCount(giveaways.count ?? 0);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`supervisor-stats-${currentWorkspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sale_items',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        () => {
          load();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'giveaways',
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
    <ComponentGate code="CRM-0124">
      <Screen scroll>
        {loading ? (
          <LoadingSpinner label="Loading stats" />
        ) : (
          <>
            <ListItemCard
              title="Sales"
              trailing={<AppText variant="h2" style={{ color: colors.primary }}>{salesCount}</AppText>}
            />
            <ListItemCard
              title="Giveaways"
              trailing={<AppText variant="h2" style={{ color: colors.success }}>{giveawayCount}</AppText>}
            />
          </>
        )}
      </Screen>
    </ComponentGate>
  );
}
