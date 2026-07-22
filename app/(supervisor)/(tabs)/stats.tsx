import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner, AppText, Card, IconChip, Badge } from '@/components/ui';
import { colors, spacing } from '@/theme';

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
            <AppText style={{ fontWeight: '700', fontSize: 20, marginBottom: 4 }}>
              Supervisor Stats
            </AppText>
            <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
              Performance monitoring for today
            </AppText>

            <Card style={{ marginBottom: spacing.md }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <IconChip
                  name="cash-outline"
                  backgroundColor={colors.primaryLight}
                  color={colors.primary}
                />
                <Badge variant="primary">Today</Badge>
              </View>
              <AppText variant="secondary" style={{ marginTop: spacing.md }}>
                Total Sales
              </AppText>
              <AppText variant="h2" style={{ color: colors.primary, marginTop: 4 }}>
                {salesCount}
              </AppText>
            </Card>

            <Card>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <IconChip
                  name="gift-outline"
                  backgroundColor={colors.muted}
                  color={colors.foreground}
                />
                <Badge variant="success">Today</Badge>
              </View>
              <AppText variant="secondary" style={{ marginTop: spacing.md }}>
                Giveaways
              </AppText>
              <AppText variant="h2" style={{ marginTop: 4 }}>
                {giveawayCount}
              </AppText>
            </Card>
          </>
        )}
      </Screen>
    </ComponentGate>
  );
}
