import { ScrollView, View } from 'react-native';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AttendanceStatusStrip } from '@/components/attendance/AttendanceStatusStrip';
import { TodayTasksStat } from '@/components/dashboard/TodayTasksStat';
import { ComponentGate } from '@/components/ComponentGate';
import { colors } from '@/theme';

export default function AgentDashboard() {
  return (
    <ComponentGate code="CRM-0089" redirectTo="/(agent)/profile">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <QuickActions />
          <AttendanceStatusStrip />
          <TodayTasksStat />
        </ScrollView>
      </View>
    </ComponentGate>
  );
}
