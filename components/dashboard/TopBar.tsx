import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { useAuth } from '@/providers/AuthProvider';
import { useUserRole } from '@/hooks/useUserRole';
import { offlineQueue } from '@/services/offlineQueue';
import { getLastCheckInPhotoUrl } from '@/utils/agentPhotos';
import { AppText } from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';

function avatarLetter(email?: string | null): string {
  if (!email) return '?';
  return email.charAt(0).toUpperCase();
}

export function TopBar() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isSupervisor } = useUserRole();
  const [pending, setPending] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    return offlineQueue.subscribe(setPending);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    getLastCheckInPhotoUrl(user.id).then(setPhotoUrl).catch(() => setPhotoUrl(null));
  }, [user?.id]);

  const handleAvatarPress = () => {
    Alert.alert(user?.email ?? 'Account', undefined, [
      { text: 'Cancel', style: 'cancel' },
      ...(!isSupervisor
        ? [{ text: 'Profile', onPress: () => router.push('/(agent)/profile' as never) }]
        : []),
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.card,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: spacing.md, minWidth: 0 }}>
          <WorkspaceSwitcher />
        </View>
        <Pressable
          onPress={handleAvatarPress}
          accessibilityLabel="Open profile menu"
          hitSlop={hitSlop}
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.full,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <AppText style={{ fontWeight: '600', color: colors.foreground }}>{avatarLetter(user?.email)}</AppText>
          )}
        </Pressable>
      </View>
      {pending > 0 ? (
        <AppText variant="secondary" style={{ color: colors.warning, marginTop: spacing.xs, flexShrink: 1 }}>
          {pending} item{pending === 1 ? '' : 's'} pending sync
        </AppText>
      ) : null}
    </View>
  );
}
