// [CRM-0105] Interaction History — paginated interaction list
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { ActivityHistoryList, type HistoryRow } from '@/components/history/ActivityHistoryList';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen } from '@/components/ui';
import { colors } from '@/theme';

export default function InteractionHistoryScreen() {
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
        .select('id, interaction_type, customer_name, created_at, outcome')
        .eq('agent_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .order('created_at', { ascending: false })
        .limit(200);

      setItems(
        (data ?? [])
          .filter((row) => row.created_at)
          .map((row) => ({
            id: row.id,
            title: row.customer_name || (row.interaction_type ?? 'Interaction').replace(/_/g, ' '),
            subtitle: (row.interaction_type ?? 'interaction').replace(/_/g, ' '),
            meta: row.outcome,
            timestamp: row.created_at!,
            badge: (row.interaction_type ?? 'interaction').replace(/_/g, ' '),
            leading: <MessageSquare size={20} color={colors.primary} />,
          })),
      );
      setLoading(false);
    };
    void load();
  }, [user?.id, currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0105">
      <Screen>
        <ActivityHistoryList
          items={items}
          loading={loading}
          emptyLabel="No interactions yet."
          onPressItem={(item) =>
            router.push(`/(agent)/activity-detail?id=${item.id}` as never)
          }
        />
      </Screen>
    </ComponentGate>
  );
}
