import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner, EmptyMessage, ListItemCard } from '@/components/ui';

type InboxMessage = { id: string; message?: string; created_at: string };

export default function InboxScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspaceId) return;

    const load = async () => {
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

    const channel = supabase
      .channel(`supervisor-inbox-${currentWorkspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'supervisor_messages',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        (payload) => {
          const row = payload.new as InboxMessage;
          setMessages((prev) => [row, ...prev.filter((m) => m.id !== row.id)].slice(0, 30));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0126">
      <Screen scroll>
        {loading ? (
          <LoadingSpinner label="Loading inbox" />
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
