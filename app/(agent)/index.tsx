import { ScrollView, View } from 'react-native';
import { TopBar } from '@/components/dashboard/TopBar';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecordAttendanceForm } from '@/components/attendance/RecordAttendanceForm';
import { WorkHoursCard } from '@/components/dashboard/WorkHoursCard';
import { UpcomingSchedule } from '@/components/dashboard/UpcomingSchedule';
import { ComponentGate } from '@/components/ComponentGate';
import { colors, spacing } from '@/theme';

export default function AgentDashboard() {
  return (
    <ComponentGate code="CRM-0089" redirectTo="/(agent)/profile">
      <View style={{ flex: 1, backgroundColor: colors.muted }}>
        <TopBar />
        <ScrollView style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}>
            <RecordAttendanceForm />
          </View>
          <QuickActions />
          <UpcomingSchedule />
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] }}>
            <WorkHoursCard />
          </View>
        </ScrollView>
      </View>
    </ComponentGate>
  );
}
