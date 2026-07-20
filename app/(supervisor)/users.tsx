import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner, ListItemCard } from '@/components/ui';

type Member = { id: string; role: string; user_id: string | null };

export default function UsersScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspaceId) return;

    const load = async () => {
      const { data } = await supabase
        .from('user_workspaces')
        .select('id, role, user_id')
        .eq('workspace_id', currentWorkspaceId);

      setMembers(data ?? []);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`supervisor-users-${currentWorkspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_workspaces',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        () => {
          load();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0123">
      <Screen scroll>
        {loading ? (
          <LoadingSpinner label="Loading users" />
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
