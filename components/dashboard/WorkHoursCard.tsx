import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { ComponentGate } from '@/components/ComponentGate';
import { AppText, Card, LoadingSpinner, ProgressBar } from '@/components/ui';
import { colors, spacing } from '@/theme';

const DAILY_TARGET_HOURS = 8;

function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (wholeHours === 0) return `${minutes}m`;
  if (minutes === 0) return `${wholeHours}h`;
  return `${wholeHours}h ${minutes}m`;
}

function calculateTodayHours(
  logs: { status: string | null; timestamp: string | null; created_at: string | null }[],
): number {
  if (!logs.length) return 0;

  let totalMinutes = 0;
  let currentCheckIn: (typeof logs)[number] | null = null;

  for (const log of logs) {
    if (log.status === 'checked_in' && !currentCheckIn) {
      currentCheckIn = log;
    } else if ((log.status === 'lunch' || log.status === 'checked_out') && currentCheckIn) {
      const start = new Date(currentCheckIn.timestamp ?? currentCheckIn.created_at ?? '').getTime();
      const end = new Date(log.timestamp ?? log.created_at ?? '').getTime();
      totalMinutes += Math.max(0, (end - start) / 60000);
      currentCheckIn = null;
    }
  }

  if (currentCheckIn) {
    const start = new Date(currentCheckIn.timestamp ?? currentCheckIn.created_at ?? '').getTime();
    totalMinutes += Math.max(0, (Date.now() - start) / 60000);
  }

  return totalMinutes / 60;
}

interface WorkHoursCardProps {
  compact?: boolean;
}

export function WorkHoursCard({ compact = false }: WorkHoursCardProps) {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [todayHours, setTodayHours] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || !currentWorkspaceId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('agent_status_log')
        .select('status, timestamp, created_at')
        .eq('agent_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .gte('timestamp', startOfDay.toISOString())
        .order('timestamp', { ascending: true });

      setTodayHours(calculateTodayHours(data ?? []));
      setLoading(false);
    };

    load();
  }, [user?.id, currentWorkspaceId]);

  const progress = Math.min(1, todayHours / DAILY_TARGET_HOURS);

  return (
    <ComponentGate code="CRM-0053">
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: compact ? spacing.md : 0 }}>
        <Card style={compact ? { paddingVertical: spacing.md } : undefined}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <AppText style={{ fontWeight: '500', flexShrink: 1 }}>Work Hours Today</AppText>
            {loading ? null : (
              <AppText variant="secondary" style={{ fontWeight: '600', color: colors.primary }}>
                {formatHours(todayHours)}
              </AppText>
            )}
          </View>
          {loading ? (
            <LoadingSpinner label="Loading hours" />
          ) : (
            <>
              <ProgressBar value={progress} style={{ marginBottom: spacing.xs }} />
              <AppText variant="secondary" style={{ flexShrink: 1 }}>
                Target: {DAILY_TARGET_HOURS} hours ({Math.round(progress * 100)}%)
              </AppText>
            </>
          )}
        </Card>
      </View>
    </ComponentGate>
  );
}
