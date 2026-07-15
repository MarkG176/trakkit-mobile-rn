import { ScrollView, View } from 'react-native';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AttendanceStatusStrip } from '@/components/attendance/AttendanceStatusStrip';
import { WorkHoursCard } from '@/components/dashboard/WorkHoursCard';
import { ComponentGate } from '@/components/ComponentGate';
import { colors, spacing } from '@/theme';

export default function AgentDashboard() {
  return (
    <ComponentGate code="CRM-0089" redirectTo="/(agent)/profile">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.lg }}
        >
          <QuickActions />
          <AttendanceStatusStrip />
          <WorkHoursCard compact />
        </ScrollView>
      </View>
    </ComponentGate>
  );
}
