import { ScrollView, View } from 'react-native';
import { RecordAttendanceForm } from '@/components/attendance/RecordAttendanceForm';
import { WorkHoursCard } from '@/components/dashboard/WorkHoursCard';
import { ExpectedActivitiesCard } from '@/components/dashboard/ExpectedActivitiesCard';
import { UpcomingSchedule } from '@/components/dashboard/UpcomingSchedule';
import { DashboardMessagesCard } from '@/components/dashboard/DashboardMessagesCard';
import { ComponentGate } from '@/components/ComponentGate';
import { useAgentDashboardData } from '@/hooks/useAgentDashboardData';
import { colors, spacing } from '@/theme';

export default function AgentDashboard() {
  const {
    loading,
    statusLogs,
    activities,
    completedCount,
    totalCount,
    schedule,
    salesTarget,
    unreadMessages,
  } = useAgentDashboardData();

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
          <WorkHoursCard logs={statusLogs} loading={loading} />
          <ExpectedActivitiesCard
            activities={activities}
            completedCount={completedCount}
            totalCount={totalCount}
            salesTarget={salesTarget}
            loading={loading}
          />
          <UpcomingSchedule items={schedule} loading={loading} />
          <DashboardMessagesCard unreadCount={unreadMessages} loading={loading} />
        </ScrollView>
      </View>
    </ComponentGate>
  );
}
