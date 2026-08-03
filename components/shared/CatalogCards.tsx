import { Image, Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Badge, Card, IconChip } from '@/components/ui';
import { colors, hitSlop, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

type ActivityCardProps = {
  title: string;
  badge: string;
  timeLabel: string;
  icon?: IoniconName;
  tone?: 'primary' | 'secondary' | 'success';
  onPress?: () => void;
};

/** Shared activity row card (CRM-0060). */
export function ActivityCard({
  title,
  badge,
  timeLabel,
  icon = 'pulse-outline',
  tone = 'secondary',
  onPress,
}: ActivityCardProps) {
  const body = (
    <Card style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        <IconChip name={icon} backgroundColor={colors.muted} color={colors.primary} />
        <View style={{ flex: 1, flexShrink: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing.sm,
              marginBottom: spacing.xs,
            }}
          >
            <Badge variant={tone}>{badge}</Badge>
            <AppText variant="secondary" style={{ fontSize: 12 }}>
              {timeLabel}
            </AppText>
          </View>
          <AppText style={{ fontWeight: '600', fontSize: 16, flexShrink: 1 }}>{title}</AppText>
        </View>
      </View>
    </Card>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} hitSlop={hitSlop}>
      {body}
    </Pressable>
  );
}

const STATUS_LABELS: Record<string, string> = {
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  set_location: 'Set Location',
  lunch: 'On Break',
  break: 'On Break',
  back_from_break: 'Back',
};

type AgentStatusItemProps = {
  title?: string;
  agentName?: string;
  status: string;
  timeLabel?: string;
  selfieUrl?: string | null;
  storeName?: string | null;
  inRange?: boolean | null;
  distanceFromAssigned?: number | null;
  locationLat?: number | null;
  locationLng?: number | null;
  onPress?: () => void;
  onSelfiePress?: (url: string) => void;
};

/** Shared agent status row (CRM-0061). */
export function AgentStatusItem({
  title,
  agentName,
  status,
  timeLabel,
  selfieUrl,
  storeName,
  inRange,
  distanceFromAssigned,
  locationLat,
  locationLng,
  onPress,
  onSelfiePress,
}: AgentStatusItemProps) {
  const displayName = agentName || title || 'Unknown Agent';
  const statusLabel = STATUS_LABELS[status] || status.replace(/_/g, ' ');
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const body = (
    <Card style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        {selfieUrl ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onSelfiePress?.(selfieUrl);
            }}
            hitSlop={hitSlop}
          >
            <CheckInThumbnail uri={selfieUrl} size={48} />
          </Pressable>
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText style={{ fontWeight: '700', color: colors.primary, fontSize: 14 }}>
              {initials || '?'}
            </AppText>
          </View>
        )}

        <View style={{ flex: 1, flexShrink: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing.sm,
            }}
          >
            <AppText style={{ fontWeight: '600', fontSize: 16, flex: 1 }} numberOfLines={1}>
              {displayName}
            </AppText>
            <Badge variant="secondary">{statusLabel}</Badge>
          </View>

          {storeName ? (
            <AppText variant="secondary" style={{ marginTop: 2, fontSize: 13 }} numberOfLines={1}>
              {storeName}
            </AppText>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: spacing.sm,
              marginTop: 4,
            }}
          >
            {timeLabel ? (
              <AppText variant="secondary" style={{ fontSize: 12 }}>
                {timeLabel}
              </AppText>
            ) : null}
            {locationLat != null && locationLng != null ? (
              <AppText variant="secondary" style={{ fontSize: 12 }}>
                {Number(locationLat).toFixed(4)}, {Number(locationLng).toFixed(4)}
              </AppText>
            ) : null}
            {inRange !== null && inRange !== undefined ? (
              <Badge variant={inRange ? 'success' : 'destructive'}>
                {inRange ? 'In Range' : 'Out of Range'}
              </Badge>
            ) : null}
          </View>

          {distanceFromAssigned != null ? (
            <AppText variant="secondary" style={{ marginTop: 2, fontSize: 12 }}>
              Distance: {Number(distanceFromAssigned).toFixed(0)}m from store
            </AppText>
          ) : null}
        </View>

        {selfieUrl ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onSelfiePress?.(selfieUrl);
            }}
            hitSlop={hitSlop}
          >
            <Image
              source={{ uri: selfieUrl }}
              style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: colors.muted }}
            />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} hitSlop={hitSlop}>
      {body}
    </Pressable>
  );
}

type CheckInThumbnailProps = {
  uri?: string | null;
  size?: number;
};

/** Check-in selfie placeholder/thumbnail (CRM-0062). */
export function CheckInThumbnail({ uri, size = 48 }: CheckInThumbnailProps) {
  if (!uri) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.muted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="camera-outline" size={size * 0.4} color={colors.mutedForeground} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.muted }}
    />
  );
}

type ImageLightboxProps = {
  uri: string | null;
  onClose: () => void;
  caption?: string | null;
};

export function ImageLightbox({ uri, onClose, caption }: ImageLightboxProps) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.85)',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: '100%', aspectRatio: 1, borderRadius: 12 }}
            resizeMode="contain"
          />
        ) : null}
        {caption ? (
          <AppText style={{ color: '#fff', textAlign: 'center', marginTop: spacing.md }}>
            {caption}
          </AppText>
        ) : null}
      </Pressable>
    </Modal>
  );
}
