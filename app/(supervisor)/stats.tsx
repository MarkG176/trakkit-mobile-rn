// [CRM-0124] Supervisor Stats — workspace KPIs with date range filter
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Gift,
  MapPin,
  ShoppingCart,
  Wallet,
} from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { DateRangeChips } from '@/components/supervisor/DateRangeChips';
import {
  AppText,
  Card,
  LoadingSpinner,
  Screen,
} from '@/components/ui';
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { workspaceService } from '@/services/workspaceService';
import { formatCurrencySimple } from '@/utils/currency';
import { colors, radius, spacing } from '@/theme';

interface StatsKpis {
  salesCount: number;
  giveawayCount: number;
  checkInCount: number;
  revenue: number;
}

export default function StatsScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const { preset, setPreset, startISO, endISO, dateLabel } = useDateRangeFilter('today');
  const currency = workspaceService.getProjectCurrencyCode();

  const { data, isLoading } = useQuery({
    queryKey: ['supervisor-stats', currentWorkspaceId, startISO, endISO],
    enabled: Boolean(currentWorkspaceId),
    queryFn: async (): Promise<StatsKpis> => {
      if (!currentWorkspaceId) {
        return { salesCount: 0, giveawayCount: 0, checkInCount: 0, revenue: 0 };
      }

      let salesQuery = supabase
        .from('sale_items')
        .select('id, total_price', { count: 'exact' })
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_deleted', false);
      if (startISO) salesQuery = salesQuery.gte('created_at', startISO);
      if (endISO) salesQuery = salesQuery.lte('created_at', endISO);

      let giveawaysQuery = supabase
        .from('giveaways')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_deleted', false);
      if (startISO) giveawaysQuery = giveawaysQuery.gte('recorded_at', startISO);
      if (endISO) giveawaysQuery = giveawaysQuery.lte('recorded_at', endISO);

      let checkInsQuery = supabase
        .from('agent_status_log')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', currentWorkspaceId)
        .eq('status', 'checked_in');
      if (startISO) checkInsQuery = checkInsQuery.gte('timestamp', startISO);
      if (endISO) checkInsQuery = checkInsQuery.lte('timestamp', endISO);

      const [sales, giveaways, checkIns] = await Promise.all([
        salesQuery,
        giveawaysQuery,
        checkInsQuery,
      ]);

      const revenue = (sales.data || []).reduce(
        (sum, row) => sum + (Number(row.total_price) || 0),
        0,
      );

      return {
        salesCount: sales.count ?? 0,
        giveawayCount: giveaways.count ?? 0,
        checkInCount: checkIns.count ?? 0,
        revenue,
      };
    },
  });

  const kpis = [
    {
      key: 'sales',
      label: 'Sales',
      value: String(data?.salesCount ?? 0),
      icon: ShoppingCart,
      color: colors.primary,
    },
    {
      key: 'giveaways',
      label: 'Giveaways',
      value: String(data?.giveawayCount ?? 0),
      icon: Gift,
      color: colors.success,
    },
    {
      key: 'checkins',
      label: 'Check-ins',
      value: String(data?.checkInCount ?? 0),
      icon: MapPin,
      color: colors.warning,
    },
    {
      key: 'revenue',
      label: 'Revenue',
      value: formatCurrencySimple(data?.revenue ?? 0, currency),
      icon: Wallet,
      color: colors.primary,
    },
  ];

  return (
    <ComponentGate code="CRM-0124">
      <Screen scroll>
        <View style={styles.header}>
          <BarChart3 size={20} color={colors.primary} />
          <AppText style={styles.headerTitle}>Stats</AppText>
          <AppText variant="secondary">{dateLabel}</AppText>
        </View>
        <DateRangeChips preset={preset} onChange={setPreset} />

        {isLoading ? (
          <LoadingSpinner label="Loading stats" />
        ) : (
          <View style={styles.grid}>
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.key} style={styles.kpiCard}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                    <Icon size={22} color={kpi.color} />
                  </View>
                  <AppText variant="secondary">{kpi.label}</AppText>
                  <AppText variant="h2" style={{ color: kpi.color }}>
                    {kpi.value}
                  </AppText>
                </Card>
              );
            })}
          </View>
        )}
      </Screen>
    </ComponentGate>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerTitle: { flex: 1, fontWeight: '600', fontSize: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  kpiCard: {
    width: '47%',
    flexGrow: 1,
    gap: spacing.xs,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});
