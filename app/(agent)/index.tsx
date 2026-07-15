import { ScrollView, View } from 'react-native';
import { RecordAttendanceForm } from '@/components/attendance/RecordAttendanceForm';
import { WorkHoursCard } from '@/components/dashboard/WorkHoursCard';
import { ExpectedActivitiesCard } from '@/components/dashboard/ExpectedActivitiesCard';
import { DashboardMessagesCard } from '@/components/dashboard/DashboardMessagesCard';
import { ComponentGate } from '@/components/ComponentGate';
import { colors, spacing } from '@/theme';

export default function AgentDashboard() {
  return (
    <ComponentGate code="CRM-0089" redirectTo="/(agent)/profile">
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
            paddingBottom: spacing.xl,
            gap: spacing.md,
          }}
        >
          <RecordAttendanceForm />
          <WorkHoursCard />
          <ExpectedActivitiesCard />
          <DashboardMessagesCard />
        </ScrollView>
      </View>
    </ComponentGate>
  );
}
