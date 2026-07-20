// [CRM-0061] Agent Status Item — live agent status row for supervisor lists
import { View } from 'react-native';
import { AppText, Badge } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export type AgentStatusItemProps = {
  name: string;
  status: string;
  subtitle?: string | null;
  inRange?: boolean | null;
};

export function AgentStatusItem({ name, status, subtitle, inRange }: AgentStatusItemProps) {
  const statusColor =
    status === 'checked_in'
      ? colors.success
      : status === 'lunch'
        ? colors.warning
        : colors.mutedForeground;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: radius.full,
          backgroundColor: statusColor,
        }}
      />
      <View style={{ flex: 1 }}>
        <AppText style={{ fontWeight: '600', color: colors.foreground }}>{name}</AppText>
        {subtitle ? (
          <AppText variant="secondary" style={{ fontSize: 12 }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Badge>{status.replace(/_/g, ' ')}</Badge>
      {inRange != null ? (
        <AppText style={{ fontSize: 11, color: inRange ? colors.success : colors.destructive }}>
          {inRange ? 'In range' : 'Out of range'}
        </AppText>
      ) : null}
    </View>
  );
}
