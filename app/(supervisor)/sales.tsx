// [CRM-0121] Supervisor Sales — sales list with date filter + agent/store
import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ShoppingCart, Store, User } from 'lucide-react-native';
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

interface SaleRow {
  id: string;
  created_at: string | null;
  product_name: string | null;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  customer_name: string | null;
  agent_id: string | null;
  store_id: string | null;
  stores: { store_name: string | null } | null;
}

export default function SalesScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const { preset, setPreset, startISO, endISO } = useDateRangeFilter('today');
  const currency = workspaceService.getProjectCurrencyCode();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['supervisor-sales', currentWorkspaceId, startISO, endISO],
    enabled: Boolean(currentWorkspaceId),
    queryFn: async (): Promise<SaleRow[]> => {
      if (!currentWorkspaceId) return [];

      let query = supabase
        .from('sale_items')
        .select(
          'id, created_at, product_name, variant_name, quantity, unit_price, total_price, customer_name, agent_id, store_id, stores:store_id(store_name)',
        )
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(200);

      if (startISO) query = query.gte('created_at', startISO);
      if (endISO) query = query.lte('created_at', endISO);

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as SaleRow[]) || [];
    },
  });

  const agentIds = useMemo(
    () => [...new Set(sales.map((s) => s.agent_id).filter(Boolean))] as string[],
    [sales],
  );

  const { data: agentNames = {} } = useQuery({
    queryKey: ['supervisor-sales-agents', currentWorkspaceId, agentIds],
    enabled: Boolean(currentWorkspaceId) && agentIds.length > 0,
    queryFn: async (): Promise<Record<string, string>> => {
      if (!currentWorkspaceId || agentIds.length === 0) return {};
      const { data } = await supabase
        .from('user_workspaces')
        .select('user_id, name, email')
        .eq('workspace_id', currentWorkspaceId)
        .in('user_id', agentIds);

      const map: Record<string, string> = {};
      (data || []).forEach((row) => {
        if (!row.user_id) return;
        map[row.user_id] =
          row.name || row.email?.split('@')[0] || row.user_id.slice(0, 8);
      });
      return map;
    },
  });

  const renderItem = useCallback(
    ({ item }: { item: SaleRow }) => {
      const label =
        [item.product_name, item.variant_name].filter(Boolean).join(' · ') || 'Sale';
      const agentLabel = item.agent_id ? agentNames[item.agent_id] : null;
      const storeName = item.stores?.store_name;

      return (
        <Card style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.flex}>
              <AppText style={styles.title}>{label}</AppText>
              {item.customer_name ? (
                <AppText variant="secondary">{item.customer_name}</AppText>
              ) : null}
            </View>
            <AppText style={styles.amount}>
              {formatCurrencySimple(item.total_price ?? 0, currency)}
            </AppText>
          </View>
          <View style={styles.metaRow}>
            <AppText variant="secondary" style={styles.metaText}>
              Qty {item.quantity}
            </AppText>
            {item.created_at ? (
              <AppText variant="secondary" style={styles.metaText}>
                {format(new Date(item.created_at), 'MMM d, HH:mm')}
              </AppText>
            ) : null}
          </View>
          {(agentLabel || storeName) && (
            <View style={styles.metaRow}>
              {agentLabel ? (
                <View style={styles.metaChip}>
                  <User size={14} color={colors.mutedForeground} />
                  <AppText variant="secondary" style={styles.metaText}>
                    {agentLabel}
                  </AppText>
                </View>
              ) : null}
              {storeName ? (
                <View style={styles.metaChip}>
                  <Store size={14} color={colors.mutedForeground} />
                  <AppText variant="secondary" style={styles.metaText}>
                    {storeName}
                  </AppText>
                </View>
              ) : null}
            </View>
          )}
        </Card>
      );
    },
    [agentNames, currency],
  );

  return (
    <ComponentGate code="CRM-0121">
      <Screen showBack style={styles.screen}>
        <View style={styles.header}>
          <ShoppingCart size={20} color={colors.primary} />
          <AppText style={styles.headerTitle}>Sales</AppText>
          <Badge variant="secondary">{String(sales.length)}</Badge>
        </View>
        <DateRangeChips preset={preset} onChange={setPreset} />

        {isLoading ? (
          <LoadingSpinner label="Loading sales" />
        ) : (
          <FlatList
            data={sales}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyMessage>No sales in this range.</EmptyMessage>}
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  flex: { flex: 1 },
  title: { fontWeight: '500' },
  amount: { fontWeight: '600', color: colors.primary },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { fontSize: 12 },
});
