import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';

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
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Inbox</Text>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : messages.length === 0 ? (
          <Text className="text-slate-600">No messages.</Text>
        ) : (
          messages.map((m) => (
            <View key={m.id} className="mb-2 rounded-xl border border-slate-200 p-4">
              <Text className="text-slate-900">{m.message}</Text>
              <Text className="text-xs text-slate-500">{new Date(m.created_at).toLocaleString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </ComponentGate>
  );
}
