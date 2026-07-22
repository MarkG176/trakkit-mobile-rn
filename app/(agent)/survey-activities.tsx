import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner, EmptyMessage, ListItemCard } from '@/components/ui';
import { SurveyResponseSheet } from '@/components/surveys/SurveyResponseSheet';

export default function SurveyActivitiesScreen() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [items, setItems] = useState<
    { id: string; created_at: string | null; survey_template_id: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [sheetId, setSheetId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user || !currentWorkspaceId) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from('survey_responses')
        .select('id, created_at, survey_template_id')
        .eq('agent_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .order('created_at', { ascending: false })
        .limit(30);
      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [user?.id, currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0108">
      <Screen scroll showBack>
        {loading ? (
          <LoadingSpinner label="Loading surveys" />
        ) : items.length === 0 ? (
          <EmptyMessage>No survey responses yet.</EmptyMessage>
        ) : (
          items.map((item) => (
            <ListItemCard
              key={item.id}
              title="Survey response"
              subtitle={item.created_at ? new Date(item.created_at).toLocaleString() : undefined}
              onPress={() => setSheetId(item.id)}
            />
          ))
        )}
      </Screen>

      <SurveyResponseSheet
        open={sheetId != null}
        responseId={sheetId}
        workspaceId={currentWorkspaceId}
        onOpenChange={(next) => {
          if (!next) setSheetId(null);
        }}
      />
    </ComponentGate>
  );
}
