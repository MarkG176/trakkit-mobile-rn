import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';

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
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Users</Text>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : (
          members.map((m) => (
            <View key={m.id} className="mb-2 rounded-xl border border-slate-200 p-4">
              <Text className="font-medium text-slate-900">User {m.user_id?.slice(0, 8) ?? 'Unknown'}…</Text>
              <Text className="text-xs capitalize text-slate-500">{m.role}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </ComponentGate>
  );
}
