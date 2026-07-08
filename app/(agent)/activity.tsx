import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';

export default function ActivityScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<{ id: string; action: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('activity_logs')
        .select('id, action, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  return (
    <ComponentGate code="CRM-0091">
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Activity</Text>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : items.length === 0 ? (
          <Text className="text-slate-600">No activity yet.</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} className="mb-2 rounded-xl border border-slate-100 p-3">
              <Text className="font-medium capitalize text-slate-900">{item.action.replace('_', ' ')}</Text>
              <Text className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </ComponentGate>
  );
}
