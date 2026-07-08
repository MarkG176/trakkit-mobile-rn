import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { formatCurrencySimple } from '@/utils/currency';
import { workspaceService } from '@/services/workspaceService';

export default function SalesScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [sales, setSales] = useState<{ id: string; product_name: string | null; total_price: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const currency = workspaceService.getProjectCurrencyCode();

  useEffect(() => {
    const load = async () => {
      if (!currentWorkspaceId) return;
      const { data } = await supabase
        .from('sale_items')
        .select('id, product_name, total_price')
        .eq('workspace_id', currentWorkspaceId)
        .order('created_at', { ascending: false })
        .limit(30);
      setSales(data ?? []);
      setLoading(false);
    };
    load();
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0121">
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Sales</Text>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : (
          sales.map((s) => (
            <View key={s.id} className="mb-2 flex-row justify-between rounded-xl border border-slate-200 p-4">
              <Text className="text-slate-900">{s.product_name ?? 'Sale'}</Text>
              <Text className="font-semibold text-blue-600">
                {formatCurrencySimple(s.total_price ?? 0, currency)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </ComponentGate>
  );
}
