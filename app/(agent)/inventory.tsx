import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import {
  Screen,
  PageHeader,
  LoadingSpinner,
  EmptyMessage,
  ListItemCard,
  AppText,
} from '@/components/ui';
import { colors } from '@/theme';

export default function InventoryScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<{ id: string; name?: string | null; amount_issued: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('agent_task_inventory')
        .select('id, name, amount_issued')
        .eq('agent_id', user.id);

      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  return (
    <ComponentGate code="CRM-0093" redirectTo="/(agent)">
      <Screen scroll>
        <PageHeader title="Inventory" />
        {loading ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <EmptyMessage>No assigned stock.</EmptyMessage>
        ) : (
          items.map((item) => (
            <ListItemCard
              key={item.id}
              title={item.name ?? 'Product'}
              trailing={<AppText style={{ fontWeight: '700', color: colors.primary }}>×{item.amount_issued}</AppText>}
            />
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
