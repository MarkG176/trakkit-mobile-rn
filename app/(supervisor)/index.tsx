import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import {
  PageHeader,
  LoadingSpinner,
  EmptyMessage,
  ListItemCard,
  AppText,
  SectionHeader,
} from '@/components/ui';
import { colors, spacing } from '@/theme';

interface AgentStatus {
  id: string;
  agent_id: string;
  status: string;
  timestamp: string;
}

export default function SupervisorDashboard() {
  const { currentWorkspaceId } = useWorkspace();
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspaceId) return;

    const load = async () => {
      const { data } = await supabase
        .from('agent_status_log')
        .select('id, agent_id, status, timestamp')
        .eq('workspace_id', currentWorkspaceId)
        .order('timestamp', { ascending: false })
        .limit(20);

      setAgents(
        (data ?? []).map((row) => ({
          id: row.id,
          agent_id: row.agent_id,
          status: row.status,
          timestamp: row.timestamp,
        })),
      );
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`supervisor-status-${currentWorkspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_status_log',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        (payload) => {
          const row = payload.new as AgentStatus;
          setAgents((prev) => [row, ...prev].slice(0, 20));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0118" redirectTo="/(agent)">
      <View style={{ flex: 1, backgroundColor: colors.muted }}>
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          }}
        >
          <PageHeader title="Supervisor" />
          <WorkspaceSwitcher />
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}
        >
          <SectionHeader title="Live agent activity" />
          {loading ? (
            <LoadingSpinner />
          ) : agents.length === 0 ? (
            <EmptyMessage>No recent agent activity.</EmptyMessage>
          ) : (
            agents.map((a) => (
              <ListItemCard
                key={a.id}
                title={`${a.agent_id.slice(0, 8)}…`}
                subtitle={new Date(a.timestamp).toLocaleString()}
                trailing={
                  <AppText style={{ textTransform: 'capitalize', color: colors.primary }}>
                    {a.status.replace(/_/g, ' ')}
                  </AppText>
                }
              />
            ))
          )}
        </ScrollView>
      </View>
    </ComponentGate>
  );
}
