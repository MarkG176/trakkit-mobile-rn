import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { useAuth } from '@/providers/AuthProvider';
import { useUserRole } from '@/hooks/useUserRole';
import { offlineQueue } from '@/services/offlineQueue';
import { AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

function displayName(email?: string | null): string {
  if (!email) return 'there';
  const local = email.split('@')[0] ?? email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function avatarLetter(email?: string | null): string {
  if (!email) return '?';
  return email.charAt(0).toUpperCase();
}

export function TopBar() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isSupervisor } = useUserRole();
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    return offlineQueue.subscribe(setPending);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await offlineQueue.processQueue();
    } finally {
      setSyncing(false);
    }
  };

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
        paddingVertical: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: spacing.md }}>
          <AppText variant="h3" style={{ fontSize: 18, fontWeight: '500' }}>
            Hello, {displayName(user?.email)}!
          </AppText>
          <View style={{ marginTop: spacing.sm }}>
            <WorkspaceSwitcher />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable
            onPress={handleSync}
            disabled={syncing}
            accessibilityLabel="Sync pending items"
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.background,
            }}
          >
            <Ionicons
              name="refresh"
              size={18}
              color={colors.foreground}
              style={syncing ? { transform: [{ rotate: '45deg' }] } : undefined}
            />
          </Pressable>
          <Pressable
            onPress={handleAvatarPress}
            accessibilityLabel="Account menu"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: colors.border,
              backgroundColor: colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText style={{ fontWeight: '600', color: colors.foreground }}>
              {avatarLetter(user?.email)}
            </AppText>
          </Pressable>
        </View>
      </View>

      {pending > 0 ? (
        <AppText variant="secondary" style={{ color: colors.warning, marginTop: spacing.sm }}>
          {pending} item{pending === 1 ? '' : 's'} pending sync
        </AppText>
      ) : null}
    </View>
  );
}
