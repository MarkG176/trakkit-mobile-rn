import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { ComponentGate } from '@/components/ComponentGate';

export function WorkHoursCard() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [todayHours, setTodayHours] = useState(0);
  const [status, setStatus] = useState<string>('unknown');

  useEffect(() => {
    const load = async () => {
      if (!user || !currentWorkspaceId) return;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('agent_status_log')
        .select('status, timestamp, created_at')
        .eq('agent_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .gte('timestamp', startOfDay.toISOString())
        .order('timestamp', { ascending: true });

      if (data?.length) {
        setStatus(data[data.length - 1].status ?? 'unknown');
        const checkIns = data.filter((d) => d.status === 'checked_in');
        if (checkIns.length > 0) {
          const first = new Date(checkIns[0].timestamp ?? checkIns[0].created_at ?? '').getTime();
          const last = new Date(data[data.length - 1].timestamp ?? data[data.length - 1].created_at ?? '').getTime();
          setTodayHours(Math.max(0, (last - first) / (1000 * 60 * 60)));
        }
      }
    };

    load();
  }, [user?.id, currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0053">
      <View className="rounded-xl border border-slate-200 bg-white p-4">
        <Text className="mb-2 text-sm font-semibold text-slate-700">Work Hours Today</Text>
        <Text className="text-2xl font-bold text-blue-600">{todayHours.toFixed(1)}h</Text>
        <Text className="mt-1 text-xs capitalize text-slate-500">Status: {status.replace('_', ' ')}</Text>
      </View>
    </ComponentGate>
  );
}
