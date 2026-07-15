import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner, ListItemCard } from '@/components/ui';

export default function ManageAgentsScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [members, setMembers] = useState<{ id: string; agent_id: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentWorkspaceId) return;
      const { data } = await supabase
        .from('team_members')
        .select('id, agent_id')
        .eq('workspace_id', currentWorkspaceId);

      setMembers(data ?? []);
      setLoading(false);
    };
    load();
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0111">
      <Screen scroll title="Manage Agents">
        {loading ? (
          <LoadingSpinner label="Loading team" />
        ) : (
          members.map((m) => (
            <ListItemCard
              key={m.id}
              title={`Agent ${m.agent_id?.slice(0, 8) ?? 'Unknown'}`}
            />
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
