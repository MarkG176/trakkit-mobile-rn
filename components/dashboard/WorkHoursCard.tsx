import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { ComponentGate } from '@/components/ComponentGate';
import { AppText, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';

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
      <Card>
        <AppText style={{ marginBottom: spacing.sm, fontWeight: '500' }}>Work Hours Today</AppText>
        <AppText variant="h2" style={{ color: colors.primary }}>{todayHours.toFixed(1)}h</AppText>
        <AppText variant="secondary" style={{ marginTop: 4, textTransform: 'capitalize' }}>
          Status: {status.replace('_', ' ')}
        </AppText>
      </Card>
    </ComponentGate>
  );
}
