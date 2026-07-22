import { ScrollView, View } from 'react-native';
import { RecordAttendanceForm } from '@/components/attendance/RecordAttendanceForm';
import { WorkHoursCard } from '@/components/dashboard/WorkHoursCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ExpectedActivitiesCard } from '@/components/dashboard/ExpectedActivitiesCard';
import { DashboardMessagesCard } from '@/components/dashboard/DashboardMessagesCard';
import { ComponentGate } from '@/components/ComponentGate';
import { useAgentDashboardData } from '@/hooks/useAgentDashboardData';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { colors, spacing } from '@/theme';

export default function AgentDashboard() {
  const { isEnabled } = useProjectComponents();
  const {
    loading,
    statusLogs,
    activities,
    completedCount,
    totalCount,
    salesTarget,
    unreadMessages,
  } = useAgentDashboardData();

  const showAttendance = isEnabled('CRM-0026') || isEnabled('CRM-0010');

  return (
    <ComponentGate code="CRM-0089" redirectTo="/(agent)/profile">
      <View style={{ flex: 1, minHeight: 0, backgroundColor: colors.canvas }}>
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
          {showAttendance ? <RecordAttendanceForm /> : null}
          <QuickActions />
          <WorkHoursCard logs={statusLogs} loading={loading} />
          <ExpectedActivitiesCard
            activities={activities}
            completedCount={completedCount}
            totalCount={totalCount}
            salesTarget={salesTarget}
            loading={loading}
          />
          <DashboardMessagesCard unreadCount={unreadMessages} loading={loading} />
        </ScrollView>
      </View>
    </ComponentGate>
  );
}
