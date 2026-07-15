import { ScrollView, View } from 'react-native';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { PerformanceCards } from '@/components/dashboard/PerformanceCards';
import { RecordAttendanceForm } from '@/components/attendance/RecordAttendanceForm';
import { WorkHoursCard } from '@/components/dashboard/WorkHoursCard';
import { UpcomingSchedule } from '@/components/dashboard/UpcomingSchedule';
import { ComponentGate } from '@/components/ComponentGate';
import { colors, spacing } from '@/theme';

export default function AgentDashboard() {
  return (
    <ComponentGate code="CRM-0089" redirectTo="/(agent)/profile">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
            <RecordAttendanceForm />
          </View>
          <PerformanceCards />
          <QuickActions />
          <UpcomingSchedule />
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}>
            <WorkHoursCard />
          </View>
        </ScrollView>
      </View>
    </ComponentGate>
  );
}
