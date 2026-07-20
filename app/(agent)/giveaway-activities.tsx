// [CRM-0107] Giveaway Activities — paginated giveaway list
import { useEffect, useState } from 'react';
import { Gift } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { ActivityHistoryList, type HistoryRow } from '@/components/history/ActivityHistoryList';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen } from '@/components/ui';
import { colors } from '@/theme';

export default function GiveawayActivitiesScreen() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [items, setItems] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || !currentWorkspaceId) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('giveaways')
        .select('id, recipient_name, total_items, created_at, recorded_at')
        .eq('agent_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .order('created_at', { ascending: false })
        .limit(200);

      setItems(
        (data ?? [])
          .map((row) => {
            const ts = row.created_at || row.recorded_at;
            if (!ts) return null;
            return {
              id: row.id,
              title: row.recipient_name || 'Giveaway',
              subtitle: row.total_items != null ? `${row.total_items} items` : null,
              timestamp: ts,
              badge: 'Giveaway',
              badgeVariant: 'primary' as const,
              leading: <Gift size={20} color={colors.primary} />,
            } satisfies HistoryRow;
          })
          .filter(Boolean) as HistoryRow[],
      );
      setLoading(false);
    };
    void load();
  }, [user?.id, currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0107">
      <Screen>
        <ActivityHistoryList
          items={items}
          loading={loading}
          emptyLabel="No giveaways yet."
        />
      </Screen>
    </ComponentGate>
  );
}
