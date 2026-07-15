import { ScrollView, View } from 'react-native';
import { RecordAttendanceForm } from '@/components/attendance/RecordAttendanceForm';
import { WorkHoursCard } from '@/components/dashboard/WorkHoursCard';
import { DashboardMessagesCard } from '@/components/dashboard/DashboardMessagesCard';
import { ComponentGate } from '@/components/ComponentGate';
import { colors, spacing } from '@/theme';

const DASHBOARD_BG = '#F4F7F8';

export default function AgentDashboard() {
  return (
    <ComponentGate code="CRM-0089" redirectTo="/(agent)/profile">
      <View style={{ flex: 1, backgroundColor: DASHBOARD_BG }}>
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
          <DashboardMessagesCard />
        </ScrollView>
      </View>
    </ComponentGate>
  );
}
