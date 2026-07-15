import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner, ListItemCard } from '@/components/ui';

export default function SurveyActivitiesScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<{ id: string; created_at: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('survey_responses')
        .select('id, created_at')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  return (
    <ComponentGate code="CRM-0108">
      <Screen scroll title="Survey Activities">
        {loading ? (
          <LoadingSpinner label="Loading surveys" />
        ) : (
          items.map((item) => (
            <ListItemCard
              key={item.id}
              title="Survey response"
              subtitle={item.created_at ? new Date(item.created_at).toLocaleString() : undefined}
            />
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
