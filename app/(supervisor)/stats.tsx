import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';

export default function StatsScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [salesCount, setSalesCount] = useState(0);
  const [giveawayCount, setGiveawayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentWorkspaceId) return;
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [sales, giveaways] = await Promise.all([
        supabase
          .from('sale_items')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', startOfDay.toISOString()),
        supabase
          .from('giveaways')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', startOfDay.toISOString()),
      ]);

      setSalesCount(sales.count ?? 0);
      setGiveawayCount(giveaways.count ?? 0);
      setLoading(false);
    };
    load();
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0124">
      <ScrollView className="flex-1 bg-slate-50 px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Stats — Today</Text>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : (
          <>
            <View className="mb-4 rounded-xl bg-white p-4">
              <Text className="text-sm text-slate-500">Sales</Text>
              <Text className="text-3xl font-bold text-blue-600">{salesCount}</Text>
            </View>
            <View className="rounded-xl bg-white p-4">
              <Text className="text-sm text-slate-500">Giveaways</Text>
              <Text className="text-3xl font-bold text-green-600">{giveawayCount}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </ComponentGate>
  );
}
