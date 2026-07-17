import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentGate } from '@/components/ComponentGate';
import { AppText, Card, LoadingSpinner, ProgressBar } from '@/components/ui';
import {
  calculateTodayHours,
  hasOpenCheckIn,
  type StatusLog,
} from '@/hooks/useAgentDashboardData';
import { colors, radius, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

const DAILY_TARGET_HOURS = 8;
const TICK_INTERVAL_MS = 30_000;

function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}m`;
}

function SectionIcon({ name }: { name: IoniconName }) {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: radius.md,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={name} size={18} color={colors.foreground} />
    </View>
  );
}

interface WorkHoursCardProps {
  logs: StatusLog[];
  loading?: boolean;
}

export function WorkHoursCard({ logs, loading = false }: WorkHoursCardProps) {
  const [todayHours, setTodayHours] = useState(() => calculateTodayHours(logs));

  useEffect(() => {
    setTodayHours(calculateTodayHours(logs));
  }, [logs]);

  useEffect(() => {
    if (!hasOpenCheckIn(logs)) return;

    const tick = () => setTodayHours(calculateTodayHours(logs));
    tick();
    const id = setInterval(tick, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [logs]);

  const progress = Math.min(1, todayHours / DAILY_TARGET_HOURS);

  return (
    <ComponentGate code="CRM-0053">
      <Card style={{ padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
          <SectionIcon name="calendar-outline" />
          <AppText variant="h3" style={{ flex: 1, fontWeight: '700', flexShrink: 1 }}>
            Work Hours
          </AppText>
          {loading ? null : (
            <AppText style={{ fontWeight: '600', color: colors.foreground }}>{formatHours(todayHours)}</AppText>
          )}
        </View>
        {loading ? (
          <LoadingSpinner label="Loading hours" />
        ) : (
          <ProgressBar value={progress} style={{ marginBottom: 0 }} />
        )}
      </Card>
    </ComponentGate>
  );
}
