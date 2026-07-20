// [CRM-0122] Supervisor Rankings — agent leaderboard with display names
import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { DateRangeChips } from '@/components/supervisor/DateRangeChips';
import {
  AppText,
  Badge,
  Card,
  EmptyMessage,
  LoadingSpinner,
  Screen,
} from '@/components/ui';
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { workspaceService } from '@/services/workspaceService';
import { formatCurrencySimple } from '@/utils/currency';
import { colors, spacing } from '@/theme';

interface RankEntry {
  agent_id: string;
  agent_name: string;
  total_sales_value: number;
  total_quantity: number;
  sales_count: number;
}

export default function RankingsScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const { preset, setPreset, startISO, endISO } = useDateRangeFilter('month');
  const currency = workspaceService.getProjectCurrencyCode();

  const { data: rankings = [], isLoading } = useQuery({
    queryKey: ['supervisor-rankings', currentWorkspaceId, startISO, endISO],
    enabled: Boolean(currentWorkspaceId),
    queryFn: async (): Promise<RankEntry[]> => {
      if (!currentWorkspaceId) return [];

      let query = supabase
        .from('daily_sales_tracking')
        .select('agent_id, agent_name, quantity_sold, total_value')
        .eq('workspace_id', currentWorkspaceId);

      if (startISO) query = query.gte('work_date', startISO.slice(0, 10));
      if (endISO) query = query.lte('work_date', endISO.slice(0, 10));

      const { data, error } = await query;
      if (error) throw error;

      const byAgent = new Map<string, RankEntry>();
      (data || []).forEach((row) => {
        const existing = byAgent.get(row.agent_id);
        if (existing) {
          existing.total_sales_value += Number(row.total_value) || 0;
          existing.total_quantity += Number(row.quantity_sold) || 0;
          existing.sales_count += 1;
          if (!existing.agent_name && row.agent_name) {
            existing.agent_name = row.agent_name;
          }
        } else {
          byAgent.set(row.agent_id, {
            agent_id: row.agent_id,
            agent_name: row.agent_name || 'Unknown',
            total_sales_value: Number(row.total_value) || 0,
            total_quantity: Number(row.quantity_sold) || 0,
            sales_count: 1,
          });
        }
      });

      return Array.from(byAgent.values()).sort(
        (a, b) => b.total_sales_value - a.total_sales_value,
      );
    },
  });

  const renderItem = useCallback(
    ({ item, index }: { item: RankEntry; index: number }) => {
      const rank = index + 1;
      const medal =
        rank === 1 ? colors.warning : rank === 2 ? colors.mutedForeground : colors.primary;

      return (
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.rankBadge, rank <= 3 && { backgroundColor: colors.primaryLight }]}>
              <AppText style={[styles.rankText, { color: medal }]}>#{rank}</AppText>
            </View>
            <View style={styles.flex}>
              <AppText style={styles.name}>{item.agent_name}</AppText>
              <AppText variant="secondary">
                {item.total_quantity} units · {item.sales_count} entries
              </AppText>
            </View>
            <AppText style={styles.value}>
              {formatCurrencySimple(item.total_sales_value, currency)}
            </AppText>
          </View>
        </Card>
      );
    },
    [currency],
  );

  return (
    <ComponentGate code="CRM-0122">
      <Screen showBack style={styles.screen}>
        <View style={styles.header}>
          <Trophy size={20} color={colors.primary} />
          <AppText style={styles.headerTitle}>Rankings</AppText>
          <Badge variant="secondary">{String(rankings.length)}</Badge>
        </View>
        <DateRangeChips preset={preset} onChange={setPreset} />

        {isLoading ? (
          <LoadingSpinner label="Loading rankings" />
        ) : (
          <FlatList
            data={rankings}
            keyExtractor={(item) => item.agent_id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyMessage>No rankings for this range.</EmptyMessage>}
          />
        )}
      </Screen>
    </ComponentGate>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerTitle: { flex: 1, fontWeight: '600', fontSize: 16 },
  list: { paddingBottom: spacing.xl, flexGrow: 1 },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontWeight: '700', fontSize: 14 },
  flex: { flex: 1 },
  name: { fontWeight: '500' },
  value: { fontWeight: '600', color: colors.primary },
});
