import { View } from 'react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { AppText, Card, LoadingSpinner, SectionHeader } from '@/components/ui';
import type { ScheduleItem } from '@/hooks/useAgentDashboardData';
import { colors, spacing } from '@/theme';

interface UpcomingScheduleProps {
  items: ScheduleItem[];
  loading?: boolean;
}

export function UpcomingSchedule({ items, loading = false }: UpcomingScheduleProps) {
  return (
    <ComponentGate code="CRM-0052">
      <View>
        <SectionHeader title="Upcoming Schedule" />
        {loading ? (
          <LoadingSpinner label="Loading schedule" />
        ) : items.length === 0 ? (
          <Card>
            <AppText variant="secondary" style={{ textAlign: 'center' }}>
              No upcoming tasks
            </AppText>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} style={{ marginBottom: spacing.sm }}>
              <AppText variant="secondary">{item.time}</AppText>
              <AppText style={{ fontWeight: '500', color: colors.primary }}>{item.title}</AppText>
              <AppText
                variant="secondary"
                style={{ marginTop: spacing.xs, textTransform: 'capitalize' }}
              >
                {item.location}
              </AppText>
            </Card>
          ))
        )}
      </View>
    </ComponentGate>
  );
}
