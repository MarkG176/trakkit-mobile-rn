import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner, ListItemCard } from '@/components/ui';

export default function GiveawayActivitiesScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<{ id: string; recipient_name: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('giveaways')
        .select('id, recipient_name, created_at')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  return (
    <ComponentGate code="CRM-0107">
      <Screen scroll title="Giveaway Activities">
        {loading ? (
          <LoadingSpinner />
        ) : (
          items.map((item) => (
            <ListItemCard
              key={item.id}
              title={item.recipient_name ?? 'Giveaway'}
              subtitle={new Date(item.created_at).toLocaleString()}
            />
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
