import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';

export default function InventoryScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<{ id: string; name?: string | null; amount_issued: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('agent_task_inventory')
        .select('id, name, amount_issued')
        .eq('agent_id', user.id);

      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  return (
    <ComponentGate code="CRM-0093" redirectTo="/(agent)">
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Inventory</Text>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : items.length === 0 ? (
          <Text className="text-slate-600">No assigned stock.</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} className="mb-3 flex-row items-center justify-between rounded-xl border border-slate-200 p-4">
              <Text className="font-medium text-slate-900">{item.name ?? 'Product'}</Text>
              <Text className="font-bold text-blue-600">×{item.amount_issued}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </ComponentGate>
  );
}
