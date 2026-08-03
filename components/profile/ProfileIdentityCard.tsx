import { View, type ViewStyle } from 'react-native';
import { AppText, Card, IconChip } from '@/components/ui';
import { colors, spacing } from '@/theme';

export function displayNameFromEmail(email?: string | null): string {
  if (!email) return 'Agent';
  const local = email.split('@')[0] ?? email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function formatProfileDate(date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

type ProfileIdentityCardProps = {
  name: string;
  dateLabel: string;
  /** Team name (or fallback) shown under the date. */
  subtitle?: string | null;
  /** When false, renders only the inner content (for modal shells that own the card). */
  withCard?: boolean;
  style?: ViewStyle;
};

export function ProfileIdentityCard({
  name,
  dateLabel,
  subtitle,
  withCard = true,
  style,
}: ProfileIdentityCardProps) {
  const content = (
    <>
      <IconChip
        name="person"
        size={56}
        iconSize={28}
        backgroundColor={colors.primary}
        color={colors.primaryForeground}
        style={{ marginBottom: spacing.md }}
      />
      <AppText
        variant="h3"
        style={{ fontWeight: '700', color: colors.foreground, textAlign: 'center' }}
      >
        {name}
      </AppText>
      <AppText
        style={{
          fontSize: 14,
          color: colors.secondaryForeground,
          textAlign: 'center',
          marginTop: spacing.xs,
        }}
      >
        {dateLabel}
      </AppText>
      {subtitle ? (
        <AppText
          style={{
            fontSize: 14,
            color: colors.secondaryForeground,
            textAlign: 'center',
            marginTop: spacing.xs,
          }}
        >
          {subtitle}
        </AppText>
      ) : null}
    </>
  );

  if (!withCard) {
    return (
      <View
        style={[
          {
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
          },
          style,
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <Card
      style={[
        {
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
        },
        style,
      ]}
    >
      {content}
    </Card>
  );
}
