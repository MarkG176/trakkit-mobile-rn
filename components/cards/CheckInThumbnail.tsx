// [CRM-0062] Check-in Thumbnail — thumbnail preview of an agent check-in photo
import { Image, View } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export type CheckInThumbnailProps = {
  uri: string | null | undefined;
  label?: string | null;
  timestamp?: string | null;
  size?: number;
};

export function CheckInThumbnail({
  uri,
  label,
  timestamp,
  size = 96,
}: CheckInThumbnailProps) {
  return (
    <View style={{ width: size, gap: spacing.xs }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: radius.md,
            backgroundColor: colors.muted,
            borderWidth: 2,
            borderColor: colors.primary,
          }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: radius.md,
            backgroundColor: colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppText variant="secondary" style={{ fontSize: 11 }}>
            No photo
          </AppText>
        </View>
      )}
      {label ? (
        <AppText numberOfLines={1} style={{ fontSize: 12, fontWeight: '500' }}>
          {label}
        </AppText>
      ) : null}
      {timestamp ? (
        <AppText variant="secondary" style={{ fontSize: 10 }}>
          {new Date(timestamp).toLocaleTimeString()}
        </AppText>
      ) : null}
    </View>
  );
}
