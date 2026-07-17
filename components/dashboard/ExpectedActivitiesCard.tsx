import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, LoadingSpinner, ProgressBar } from '@/components/ui';
import type { ExpectedActivity, SalesTarget } from '@/hooks/useAgentDashboardData';
import { colors, radius, spacing } from '@/theme';

function ActivityRow({ name, completed, isLast }: { name: string; completed: boolean; isLast: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Ionicons
        name={completed ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={completed ? colors.success : colors.mutedForeground}
      />
      <AppText
        style={{
          flex: 1,
          flexShrink: 1,
          color: completed ? colors.foreground : colors.secondaryForeground,
          textDecorationLine: completed ? 'line-through' : 'none',
        }}
      >
        {name}
      </AppText>
    </View>
  );
}

interface ExpectedActivitiesCardProps {
  activities: ExpectedActivity[];
  completedCount: number;
  totalCount: number;
  salesTarget: SalesTarget;
  loading?: boolean;
}

export function ExpectedActivitiesCard({
  activities,
  completedCount,
  totalCount,
  salesTarget,
  loading = false,
}: ExpectedActivitiesCardProps) {
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const salesProgress =
    salesTarget.target > 0 ? Math.min(1, salesTarget.current / salesTarget.target) : 0;

  return (
    <Card style={{ padding: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.md,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="list-outline" size={18} color={colors.foreground} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="h3" style={{ fontWeight: '700', flexShrink: 1 }}>
            Today's Activities
          </AppText>
          <AppText variant="secondary" style={{ marginTop: 2 }}>
            {loading ? 'Loading activities' : `${completedCount} of ${totalCount} complete`}
          </AppText>
        </View>
      </View>

      {loading ? (
        <LoadingSpinner label="Loading activities" />
      ) : (
        <>
          <ProgressBar value={progress} style={{ marginBottom: spacing.md }} />
          <View>
            {activities.map((activity, index) => (
              <ActivityRow
                key={activity.code}
                name={activity.name}
                completed={activity.completed}
                isLast={index === activities.length - 1}
              />
            ))}
          </View>

          <View
            style={{
              marginTop: spacing.md,
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing.sm,
              }}
            >
              <AppText style={{ fontWeight: '600', flexShrink: 1 }}>Sales Target</AppText>
              <AppText variant="secondary">
                {salesTarget.current} / {salesTarget.target}
              </AppText>
            </View>
            <ProgressBar value={salesProgress} style={{ marginBottom: 0 }} />
          </View>
        </>
      )}
    </Card>
  );
}
