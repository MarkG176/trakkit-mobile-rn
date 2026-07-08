import { ScrollView, View } from 'react-native';
import { TopBar } from '@/components/dashboard/TopBar';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecordAttendanceForm } from '@/components/attendance/RecordAttendanceForm';
import { WorkHoursCard } from '@/components/dashboard/WorkHoursCard';
import { UpcomingSchedule } from '@/components/dashboard/UpcomingSchedule';
import { ComponentGate } from '@/components/ComponentGate';

export default function AgentDashboard() {
  return (
    <ComponentGate code="CRM-0089" redirectTo="/(agent)/profile">
      <View className="flex-1 bg-slate-50">
        <TopBar />
        <ScrollView className="flex-1">
          <View className="px-4 py-4">
            <RecordAttendanceForm />
          </View>
          <QuickActions />
          <UpcomingSchedule />
          <View className="px-4 pb-8">
            <WorkHoursCard />
          </View>
        </ScrollView>
      </View>
    </ComponentGate>
  );
}
