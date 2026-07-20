// [CRM-0108] Survey Activities — paginated survey responses
import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { ActivityHistoryList, type HistoryRow } from '@/components/history/ActivityHistoryList';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen } from '@/components/ui';
import { colors } from '@/theme';

export default function SurveyActivitiesScreen() {
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
        .from('survey_responses')
        .select('id, created_at, completion_status, survey_template_id')
        .eq('agent_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .order('created_at', { ascending: false })
        .limit(200);

      setItems(
        (data ?? [])
          .filter((row) => row.created_at)
          .map((row) => ({
            id: row.id,
            title: 'Survey response',
            subtitle: row.completion_status?.replace(/_/g, ' ') || 'Survey',
            timestamp: row.created_at!,
            badge: 'Survey',
            badgeVariant: 'secondary' as const,
            leading: <ClipboardList size={20} color={colors.primary} />,
          })),
      );
      setLoading(false);
    };
    void load();
  }, [user?.id, currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0108">
      <Screen>
        <ActivityHistoryList
          items={items}
          loading={loading}
          emptyLabel="No survey responses yet."
        />
      </Screen>
    </ComponentGate>
  );
}
