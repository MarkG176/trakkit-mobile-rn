import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentGate } from '@/components/ComponentGate';
import { useTodayTasksStat } from '@/hooks/useTodayTasksStat';
import { AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

export function TodayTasksStat() {
  const { completed, total, loading } = useTodayTasksStat();

  if (loading) {
    return (
      <ComponentGate code="CRM-0053">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
          }}
        >
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </ComponentGate>
    );
  }

  if (total === 0) return null;

  return (
    <ComponentGate code="CRM-0053">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
        }}
      >
        <Ionicons name="checkbox-outline" size={16} color={colors.secondaryForeground} />
        <AppText variant="secondary">
          {completed}/{total} tasks completed today
        </AppText>
      </View>
    </ComponentGate>
  );
}
