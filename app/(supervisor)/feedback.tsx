import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner, ListItemCard } from '@/components/ui';

export default function FeedbackScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [items, setItems] = useState<{ id: string; outcome: string | null; created_at: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentWorkspaceId) return;
      const { data } = await supabase
        .from('interactions')
        .select('id, outcome, created_at')
        .eq('workspace_id', currentWorkspaceId)
        .not('outcome', 'is', null)
        .order('created_at', { ascending: false })
        .limit(30);
      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0119">
      <Screen scroll title="Feedback">
        {loading ? (
          <LoadingSpinner label="Loading feedback" />
        ) : (
          items.map((item) => (
            <ListItemCard
              key={item.id}
              title={item.outcome ?? ''}
              subtitle={item.created_at ? new Date(item.created_at).toLocaleString() : undefined}
            />
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
