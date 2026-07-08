import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';

interface RouteStop {
  id: string;
  area_name?: string | null;
  status?: string;
}

export default function RoutesScreen() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || !currentWorkspaceId) return;
      const today = new Date().toISOString().split('T')[0];

      const { data: assignments } = await supabase
        .from('route_assignments')
        .select('id, area_name, status')
        .eq('workspace_id', currentWorkspaceId)
        .eq('agent_id', user.id)
        .eq('date', today);

      setStops(assignments ?? []);
      setLoading(false);
    };
    load();
  }, [user?.id, currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0098" redirectTo="/(agent)">
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Today&apos;s Route</Text>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : stops.length === 0 ? (
          <Text className="text-slate-600">No route assigned for today.</Text>
        ) : (
          stops.map((stop, i) => (
            <View key={stop.id} className="mb-3 rounded-xl border border-slate-200 p-4">
              <Text className="font-semibold text-slate-900">
                {i + 1}. {stop.area_name ?? 'Stop'}
              </Text>
              <Text className="mt-1 text-xs capitalize text-blue-600">{stop.status ?? 'pending'}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </ComponentGate>
  );
}
