import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';

export default function SalesActivitiesScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<{ id: string; product_name: string | null; created_at: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('sale_items')
        .select('id, product_name, created_at')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  return (
    <ComponentGate code="CRM-0106">
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Sales Activities</Text>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : (
          items.map((item) => (
            <View key={item.id} className="mb-2 rounded-xl border border-slate-100 p-3">
              <Text className="text-slate-900">{item.product_name ?? 'Sale'}</Text>
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
