import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import {
  Screen,
  LoadingSpinner,
  EmptyMessage,
  ListItemCard,
  AppText,
} from '@/components/ui';
import { colors } from '@/theme';

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
      <Screen scroll title="Stores" subtitle="Today's assigned stores">
        {loading ? (
          <LoadingSpinner label="Loading stores" />
        ) : stops.length === 0 ? (
          <EmptyMessage>No stores assigned for today.</EmptyMessage>
        ) : (
          stops.map((stop, i) => (
            <ListItemCard
              key={stop.id}
              title={`${i + 1}. ${stop.area_name ?? 'Stop'}`}
              subtitle={(stop.status ?? 'pending').replace(/_/g, ' ')}
              trailing={
                <AppText variant="secondary" style={{ textTransform: 'capitalize', color: colors.primary }}>
                  {stop.status ?? 'pending'}
                </AppText>
              }
            />
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
