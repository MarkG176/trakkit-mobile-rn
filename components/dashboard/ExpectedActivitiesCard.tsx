import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpectedActivities } from '@/hooks/useExpectedActivities';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { AppText, Card, LoadingSpinner, ProgressBar } from '@/components/ui';
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

export function ExpectedActivitiesCard() {
  const { isInitialized } = useWorkspace();
  const { activities, completedCount, totalCount, loading } = useExpectedActivities();

  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const showLoading = !isInitialized || loading;

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
            Today&apos;s Activities
          </AppText>
          <AppText variant="secondary" style={{ marginTop: 2 }}>
            {showLoading ? 'Loading activities' : `${completedCount} of ${totalCount} complete`}
          </AppText>
        </View>
      </View>

      {showLoading ? (
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
        </>
      )}
    </Card>
  );
}
