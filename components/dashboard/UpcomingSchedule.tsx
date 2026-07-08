import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  location: string;
}

export function UpcomingSchedule() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || !currentWorkspaceId) return;
      const today = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('route_assignments')
        .select('id, area_name, status, date')
        .eq('workspace_id', currentWorkspaceId)
        .eq('agent_id', user.id)
        .eq('date', today)
        .limit(5);

      setItems(
        (data ?? []).map((row) => ({
          id: row.id,
          time: 'Today',
          title: row.area_name ?? 'Visit',
          location: row.status ?? 'pending',
        })),
      );
      setLoading(false);
    };
    load();
  }, [user?.id, currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0052">
      <View className="px-4 py-4">
        <Text className="mb-3 text-base font-bold text-slate-900">Upcoming Schedule</Text>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : items.length === 0 ? (
          <View className="rounded-xl border border-slate-200 bg-white p-6">
            <Text className="text-center text-slate-500">No upcoming tasks</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} className="mb-2 rounded-xl border border-slate-200 bg-white p-4">
              <Text className="text-xs text-slate-500">{item.time}</Text>
              <Text className="font-medium text-blue-600">{item.title}</Text>
              <Text className="mt-1 text-xs capitalize text-slate-500">{item.location}</Text>
            </View>
          ))
        )}
      </View>
    </ComponentGate>
  );
}
