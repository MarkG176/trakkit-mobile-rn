import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner, ListItemCard } from '@/components/ui';

export default function SalesActivitiesScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<{ id: string; product_name: string | null; created_at: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('sale_items')
        .select('id, product_name, created_at')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  return (
    <ComponentGate code="CRM-0106">
      <Screen scroll title="Sales Activities">
        {loading ? (
          <LoadingSpinner />
        ) : (
          items.map((item) => (
            <ListItemCard
              key={item.id}
              title={item.product_name ?? 'Sale'}
              subtitle={item.created_at ? new Date(item.created_at).toLocaleString() : undefined}
            />
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
