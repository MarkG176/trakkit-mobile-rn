import { useEffect, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { ProfileMenuModal } from '@/components/profile/ProfileMenuModal';
import { useAuth } from '@/providers/AuthProvider';
import { useUserRole } from '@/hooks/useUserRole';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { offlineQueue } from '@/services/offlineQueue';
import { getLastCheckInPhotoUrl } from '@/utils/agentPhotos';
import { AppText, IconButton } from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';

function avatarLetter(email?: string | null): string {
  if (!email) return '?';
  return email.charAt(0).toUpperCase();
}

function badgeLabel(count: number): string {
  return count > 9 ? '9+' : String(count);
}

export function TopBar() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isSupervisor } = useUserRole();
  const { unreadCount } = useUnreadNotifications();
  const [pending, setPending] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    return offlineQueue.subscribe(setPending);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    getLastCheckInPhotoUrl(user.id).then(setPhotoUrl).catch(() => setPhotoUrl(null));
  }, [user?.id]);

  const openNotifications = () => {
    if (isSupervisor) {
      router.push('/(supervisor)/(tabs)/inbox' as never);
    } else {
      router.push('/(agent)/support-ticket' as never);
    }
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
        <View style={{ flex: 1, paddingRight: spacing.sm, minWidth: 0 }}>
          <WorkspaceSwitcher />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ position: 'relative' }}>
            <IconButton
              onPress={openNotifications}
              accessibilityLabel={
                unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : 'Notifications'
              }
              style={{ backgroundColor: colors.muted }}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
            </IconButton>
            {unreadCount > 0 ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  minWidth: 18,
                  height: 18,
                  borderRadius: radius.full,
                  backgroundColor: colors.destructive,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                  borderWidth: 2,
                  borderColor: colors.card,
                }}
              >
                <AppText
                  style={{
                    color: colors.primaryForeground,
                    fontSize: 10,
                    fontWeight: '700',
                    lineHeight: 12,
                  }}
                >
                  {badgeLabel(unreadCount)}
                </AppText>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() => setMenuOpen(true)}
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
      </View>
      {pending > 0 ? (
        <AppText variant="secondary" style={{ color: colors.warning, marginTop: spacing.xs, flexShrink: 1 }}>
          {pending} item{pending === 1 ? '' : 's'} pending sync
        </AppText>
      ) : null}

      <ProfileMenuModal
        open={menuOpen}
        onOpenChange={setMenuOpen}
        email={user?.email}
        showProfile={!isSupervisor}
        onProfile={() => router.push('/(agent)/profile' as never)}
        onSignOut={() => void signOut()}
      />
    </View>
  );
}
