import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';

export default function RankingsScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [ranks, setRanks] = useState<{ agent_id: string; current_rank: string | null; total_points: number | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      let query = supabase
        .from('agent_ranks')
        .select('agent_id, current_rank, total_points')
        .order('total_points', { ascending: false })
        .limit(20);

      if (currentWorkspaceId) {
        query = query.eq('workspace_id', currentWorkspaceId);
      }

      const { data } = await query;
      setRanks(data ?? []);
      setLoading(false);
    };
    load();
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0122">
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Rankings</Text>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : (
          ranks.map((r, i) => (
            <View key={r.agent_id} className="mb-2 flex-row items-center rounded-xl border border-slate-200 p-4">
              <Text className="mr-3 text-lg font-bold text-blue-600">#{i + 1}</Text>
              <View className="flex-1">
                <Text className="font-medium text-slate-900">{r.current_rank ?? 'Agent'}</Text>
                <Text className="text-sm text-slate-500">{r.total_points ?? 0} pts</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </ComponentGate>
  );
}
