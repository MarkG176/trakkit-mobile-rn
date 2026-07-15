import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner, ListItemCard } from '@/components/ui';

export default function UsersScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [members, setMembers] = useState<{ id: string; role: string; user_id: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentWorkspaceId) return;
      const { data } = await supabase
        .from('user_workspaces')
        .select('id, role, user_id')
        .eq('workspace_id', currentWorkspaceId);

      setMembers(data ?? []);
      setLoading(false);
    };
    load();
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0123">
      <Screen scroll title="Users">
        {loading ? (
          <LoadingSpinner />
        ) : (
          members.map((m) => (
            <ListItemCard
              key={m.id}
              title={`User ${m.user_id?.slice(0, 8) ?? 'Unknown'}…`}
              subtitle={m.role}
            />
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
