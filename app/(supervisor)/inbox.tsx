import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner, EmptyMessage, ListItemCard } from '@/components/ui';

export default function InboxScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [messages, setMessages] = useState<{ id: string; message?: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentWorkspaceId) return;
      const { data } = await supabase
        .from('supervisor_messages')
        .select('id, message, created_at')
        .eq('workspace_id', currentWorkspaceId)
        .order('created_at', { ascending: false })
        .limit(30);

      setMessages(data ?? []);
      setLoading(false);
    };
    load();
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0126">
      <Screen scroll title="Inbox">
        {loading ? (
          <LoadingSpinner />
        ) : messages.length === 0 ? (
          <EmptyMessage>No messages.</EmptyMessage>
        ) : (
          messages.map((m) => (
            <ListItemCard
              key={m.id}
              title={m.message ?? ''}
              subtitle={new Date(m.created_at).toLocaleString()}
            />
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
