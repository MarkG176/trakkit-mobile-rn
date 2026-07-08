import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';

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
      <View className="flex-1 bg-slate-50">
        <View className="border-b border-slate-200 bg-white px-4 py-3">
          <Text className="text-lg font-bold text-slate-900">Supervisor</Text>
          <WorkspaceSwitcher />
        </View>
        <ScrollView className="flex-1 px-4 py-4">
          <Text className="mb-3 font-semibold text-slate-800">Live agent activity</Text>
          {loading ? (
            <ActivityIndicator color="#2563eb" />
          ) : agents.length === 0 ? (
            <Text className="text-slate-600">No recent agent activity.</Text>
          ) : (
            agents.map((a) => (
              <View key={a.id} className="mb-2 rounded-xl bg-white p-4">
                <Text className="font-medium text-slate-900">{a.agent_id.slice(0, 8)}…</Text>
                <Text className="capitalize text-sm text-blue-600">{a.status.replace('_', ' ')}</Text>
                <Text className="text-xs text-slate-500">{new Date(a.timestamp).toLocaleString()}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </ComponentGate>
  );
}
