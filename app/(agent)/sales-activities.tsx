// [CRM-0106] Sales Activities — paginated sales list
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ShoppingCart } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { ActivityHistoryList, type HistoryRow } from '@/components/history/ActivityHistoryList';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { formatProductName } from '@/utils/formatProductName';
import { Screen } from '@/components/ui';
import { colors } from '@/theme';

export default function SalesActivitiesScreen() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const router = useRouter();
  const [items, setItems] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || !currentWorkspaceId) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('interactions')
        .select(
          'id, customer_name, sale_value, created_at, product_variants(name, sku)',
        )
        .eq('agent_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .eq('interaction_type', 'sale')
        .order('created_at', { ascending: false })
        .limit(200);

      setItems(
        (data ?? [])
          .filter((row) => row.created_at)
          .map((row) => {
            const pv = (row as any).product_variants;
            const product = pv ? formatProductName(pv.name, pv.sku, 'Product') : 'Sale';
            return {
              id: row.id,
              title: row.customer_name || 'Customer',
              subtitle: product,
              meta: row.sale_value != null ? String(row.sale_value) : null,
              timestamp: row.created_at!,
              badge: 'Sale',
              badgeVariant: 'success' as const,
              leading: <ShoppingCart size={20} color={colors.primary} />,
            };
          }),
      );
      setLoading(false);
    };
    void load();
  }, [user?.id, currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0106">
      <Screen>
        <ActivityHistoryList
          items={items}
          loading={loading}
          emptyLabel="No sales yet."
          onPressItem={(item) =>
            router.push(`/(agent)/activity-detail?id=${item.id}` as never)
          }
        />
      </Screen>
    </ComponentGate>
  );
}
