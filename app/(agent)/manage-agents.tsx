import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';

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
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_active', true);

      setMembers(data ?? []);
      setLoading(false);
    };
    load();
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0111" redirectTo="/(agent)/more">
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Manage Agents</Text>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : (
          members.map((m) => (
            <View key={m.id} className="mb-2 rounded-xl border border-slate-200 p-4">
              <Text className="font-medium text-slate-900">Agent {m.agent_id?.slice(0, 8) ?? 'Unknown'}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </ComponentGate>
  );
}
