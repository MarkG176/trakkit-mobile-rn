// [CRM-0060] Activity Card — compact summary of a recent agent activity
import { View, Image } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export type ActivityCardProps = {
  title: string;
  subtitle?: string | null;
  timestamp?: string | null;
  thumbnailUrl?: string | null;
  status?: string | null;
};

export function ActivityCard({
  title,
  subtitle,
  timestamp,
  thumbnailUrl,
  status,
}: ActivityCardProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={{ width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.muted }}
        />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.sm,
            backgroundColor: colors.primaryLight,
          }}
        />
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText style={{ fontWeight: '600', color: colors.foreground }}>{title}</AppText>
        {subtitle ? (
          <AppText variant="secondary" style={{ fontSize: 13 }}>
            {subtitle}
          </AppText>
        ) : null}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 2 }}>
          {status ? (
            <AppText style={{ fontSize: 12, color: colors.primary, fontWeight: '500' }}>
              {status}
            </AppText>
          ) : null}
          {timestamp ? (
            <AppText variant="secondary" style={{ fontSize: 12 }}>
              {new Date(timestamp).toLocaleString()}
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
}
