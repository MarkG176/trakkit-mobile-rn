import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { AppText, Card, SectionHeader } from '@/components/ui';
import { colors, spacing } from '@/theme';

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
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}>
        <SectionHeader title="Upcoming Schedule" />
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : items.length === 0 ? (
          <Card>
            <AppText variant="secondary" style={{ textAlign: 'center' }}>No upcoming tasks</AppText>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} style={{ marginBottom: spacing.sm }}>
              <AppText variant="secondary">{item.time}</AppText>
              <AppText style={{ fontWeight: '500', color: colors.primary }}>{item.title}</AppText>
              <AppText variant="secondary" style={{ marginTop: 4, textTransform: 'capitalize' }}>{item.location}</AppText>
            </Card>
          ))
        )}
      </View>
    </ComponentGate>
  );
}
