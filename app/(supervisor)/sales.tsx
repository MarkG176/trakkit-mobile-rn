import { useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { formatCurrencySimple } from '@/utils/currency';
import { workspaceService } from '@/services/workspaceService';
import {
  AppText,
  EmptyMessage,
  Input,
  ListItemCard,
  LoadingSpinner,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { colors, hitSlop, spacing } from '@/theme';

type SaleItem = {
  id: string;
  created_at: string;
  product_name: string | null;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  customer_name: string | null;
  agent_id: string | null;
};

type AggregatedSale = {
  customer_name: string;
  total_quantity: number;
  total_value: number;
  products: string[];
  last_sale_date: string;
  sales_count: number;
  agent_ids: Set<string>;
};

export default function SalesScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const currency = workspaceService.getProjectCurrencyCode();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<AggregatedSale | null>(null);
  const [nameByAgent, setNameByAgent] = useState<Record<string, string>>({});

  const { data: salesData = [], isLoading } = useQuery({
    queryKey: ['mobile-sales', currentWorkspaceId],
    queryFn: async (): Promise<SaleItem[]> => {
      const { data, error } = await supabase
        .from('sale_items')
        .select(
          'id, created_at, product_name, variant_name, quantity, unit_price, customer_name, agent_id',
        )
        .eq('workspace_id', currentWorkspaceId!)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;

      const agentIds = [
        ...new Set((data ?? []).map((s) => s.agent_id).filter((id): id is string => !!id)),
      ];
      if (agentIds.length > 0) {
        const { data: members } = await supabase
          .from('user_workspaces')
          .select('user_id, name, email')
          .eq('workspace_id', currentWorkspaceId!)
          .in('user_id', agentIds);
        const map: Record<string, string> = {};
        (members ?? []).forEach((m) => {
          if (!m.user_id) return;
          map[m.user_id] = m.name || m.email?.split('@')[0] || 'Agent';
        });
        setNameByAgent(map);
      }

      return (data ?? []).map((row) => ({
        ...row,
        created_at: row.created_at || new Date().toISOString(),
      }));
    },
    enabled: !!currentWorkspaceId,
  });

  const aggregatedSales = useMemo(() => {
    const customerMap = new Map<string, AggregatedSale>();
    salesData.forEach((sale) => {
      const customerKey = (sale.customer_name || 'Unknown').trim().toLowerCase();
      const displayName = sale.customer_name || 'Unknown';
      const productName = sale.product_name || sale.variant_name || 'N/A';
      const saleValue = sale.quantity * sale.unit_price;

      if (customerMap.has(customerKey)) {
        const existing = customerMap.get(customerKey)!;
        existing.total_quantity += sale.quantity;
        existing.total_value += saleValue;
        existing.sales_count += 1;
        if (new Date(sale.created_at) > new Date(existing.last_sale_date)) {
          existing.last_sale_date = sale.created_at;
        }
        if (!existing.products.includes(productName)) existing.products.push(productName);
        if (sale.agent_id) existing.agent_ids.add(sale.agent_id);
      } else {
        customerMap.set(customerKey, {
          customer_name: displayName,
          total_quantity: sale.quantity,
          total_value: saleValue,
          products: [productName],
          last_sale_date: sale.created_at,
          sales_count: 1,
          agent_ids: new Set(sale.agent_id ? [sale.agent_id] : []),
        });
      }
    });
    return Array.from(customerMap.values());
  }, [salesData]);

  const filteredSales = aggregatedSales.filter(
    (sale) =>
      sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.products.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const agentNamesFor = (sale: AggregatedSale) =>
    [...sale.agent_ids]
      .map((id) => nameByAgent[id] || 'Agent')
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .join(', ');

  return (
    <ComponentGate code="CRM-0121">
      <Screen scroll showBack>
        <SectionHeader title="Sales by customer" />
        <Input
          placeholder="Search by customer or product..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
          {filteredSales.length} customers • {salesData.length} transactions
        </AppText>

        {isLoading ? (
          <LoadingSpinner label="Loading sales" />
        ) : filteredSales.length === 0 ? (
          <EmptyMessage>No sales found.</EmptyMessage>
        ) : (
          filteredSales.map((sale) => (
            <Pressable
              key={`${sale.customer_name}-${sale.last_sale_date}`}
              onPress={() => setSelectedSale(sale)}
              hitSlop={hitSlop}
            >
              <ListItemCard
                title={sale.customer_name}
                subtitle={[
                  `${sale.sales_count} sales`,
                  `${sale.total_quantity} units`,
                  agentNamesFor(sale) || null,
                  format(new Date(sale.last_sale_date), 'MMM d, yyyy'),
                ]
                  .filter(Boolean)
                  .join(' • ')}
                trailing={
                  <AppText style={{ fontWeight: '600', color: colors.primary }}>
                    {formatCurrencySimple(sale.total_value, currency)}
                  </AppText>
                }
              />
            </Pressable>
          ))
        )}

        <Modal
          visible={!!selectedSale}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedSale(null)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <Pressable style={{ flex: 1 }} onPress={() => setSelectedSale(null)} />
            <View
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: spacing.md,
                gap: spacing.sm,
              }}
            >
              <AppText style={{ fontWeight: '700', fontSize: 18 }}>
                {selectedSale?.customer_name}
              </AppText>
              <AppText variant="secondary">
                {selectedSale
                  ? `${selectedSale.sales_count} sales • ${selectedSale.total_quantity} units • ${formatCurrencySimple(selectedSale.total_value, currency)}`
                  : ''}
              </AppText>
              {selectedSale ? (
                <AppText variant="secondary">Agents: {agentNamesFor(selectedSale) || '—'}</AppText>
              ) : null}
              <AppText style={{ fontWeight: '600', marginTop: spacing.sm }}>Products</AppText>
              {(selectedSale?.products ?? []).map((p) => (
                <AppText key={p} variant="secondary">
                  • {p}
                </AppText>
              ))}
              <Pressable onPress={() => setSelectedSale(null)} hitSlop={hitSlop}>
                <AppText style={{ color: colors.primary, fontWeight: '600', marginTop: spacing.md }}>
                  Close
                </AppText>
              </Pressable>
            </View>
          </View>
        </Modal>
      </Screen>
    </ComponentGate>
  );
}
