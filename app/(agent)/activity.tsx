import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import {
  Screen,
  LoadingSpinner,
  EmptyMessage,
  ListItemCard,
} from '@/components/ui';

export default function ActivityScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<{ id: string; action: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('activity_logs')
        .select('id, action, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  return (
    <ComponentGate code="CRM-0091">
      <Screen scroll title="Activity">
        {loading ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <EmptyMessage>No activity yet.</EmptyMessage>
        ) : (
          items.map((item) => (
            <ListItemCard
              key={item.id}
              title={item.action.replace(/_/g, ' ')}
              subtitle={new Date(item.created_at).toLocaleString()}
            />
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
