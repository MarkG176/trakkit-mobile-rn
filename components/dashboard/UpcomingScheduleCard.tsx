import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { AppText, Card, EmptyMessage, LoadingSpinner, SectionHeader } from '@/components/ui';
import { colors, spacing } from '@/theme';

type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  location: string;
};

export function UpcomingScheduleCard() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || !currentWorkspaceId) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const [{ data: visits }, { data: routes }] = await Promise.all([
        supabase
          .from('store_visits')
          .select('id, planned_time, planned_date, status, store_id')
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('planned_date', today)
          .order('visit_order', { ascending: true })
          .limit(10),
        supabase
          .from('route_assignments')
          .select('id, area_name, status, date')
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('date', today)
          .limit(10),
      ]);

      const fromVisits: ScheduleItem[] = (visits ?? []).map((v) => ({
        id: v.id,
        time: v.planned_time ?? 'All day',
        title: 'Store visit',
        location: (v.status ?? 'pending').replace(/_/g, ' '),
      }));

      const fromRoutes: ScheduleItem[] =
        fromVisits.length > 0
          ? []
          : (routes ?? []).map((r) => ({
              id: r.id,
              time: 'Today',
              title: r.area_name ?? 'Route stop',
              location: (r.status ?? 'pending').replace(/_/g, ' '),
            }));

      setItems([...fromVisits, ...fromRoutes]);
      setLoading(false);
    };
    void load();
  }, [user?.id, currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0052">
      <View>
        <SectionHeader title="Upcoming Schedule" />
        {loading ? (
          <LoadingSpinner label="Loading schedule" />
        ) : items.length === 0 ? (
          <EmptyMessage>No upcoming tasks for today.</EmptyMessage>
        ) : (
          items.map((item) => (
            <Card key={item.id} style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1, flexShrink: 1 }}>
                  <AppText variant="secondary" style={{ fontSize: 13 }}>
                    {item.time}
                  </AppText>
                  <AppText style={{ fontWeight: '600', fontSize: 16, marginTop: 2 }}>
                    {item.title}
                  </AppText>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 4,
                    }}
                  >
                    <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
                    <AppText variant="secondary" style={{ fontSize: 13, flexShrink: 1 }}>
                      {item.location}
                    </AppText>
                  </View>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>
    </ComponentGate>
  );
}
