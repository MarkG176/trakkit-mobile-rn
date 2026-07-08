import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';

export default function FeedbackScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [items, setItems] = useState<{ id: string; outcome: string | null; created_at: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentWorkspaceId) return;
      const { data } = await supabase
        .from('interactions')
        .select('id, outcome, created_at')
        .eq('workspace_id', currentWorkspaceId)
        .not('outcome', 'is', null)
        .order('created_at', { ascending: false })
        .limit(30);
      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0119">
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Feedback</Text>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : (
          items.map((item) => (
            <View key={item.id} className="mb-2 rounded-xl border border-slate-200 p-4">
              <Text className="text-slate-900">{item.outcome}</Text>
              <Text className="text-xs text-slate-500">
                {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </ComponentGate>
  );
}
