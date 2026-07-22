import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { WorkHoursCard } from '@/components/dashboard/WorkHoursCard';
import { useAgentDashboardData } from '@/hooks/useAgentDashboardData';
import { AppText, Card, IconChip } from '@/components/ui';
import { colors, hitSlop, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

function displayName(email?: string | null): string {
  if (!email) return 'Agent';
  const local = email.split('@')[0] ?? email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

type ProfileLink = {
  code: string;
  label: string;
  icon: IoniconName;
  path: `/(agent)/${string}`;
};

const PROFILE_LINKS: ProfileLink[] = [
  { code: 'CRM-0091', label: 'Activity', icon: 'pulse-outline', path: '/(agent)/activity' },
  { code: 'CRM-0101', label: 'Settings', icon: 'settings-outline', path: '/(agent)/settings' },
  { code: 'CRM-0100', label: 'More', icon: 'grid-outline', path: '/(agent)/more' },
  { code: 'CRM-0109', label: 'Help', icon: 'help-circle-outline', path: '/(agent)/help-support' },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { currentWorkspaceId, currentWorkspaceLabel } = useWorkspace();
  const { isEnabled } = useProjectComponents();
  const router = useRouter();
  const { statusLogs, loading: hoursLoading } = useAgentDashboardData();
  const [rank, setRank] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [salesToday, setSalesToday] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!user || !currentWorkspaceId) {
        setRank(null);
        setPoints(0);
        setSalesToday(0);
        return;
      }

      const { data: rankData } = await supabase
        .from('agent_ranks')
        .select('current_rank, total_points')
        .eq('agent_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .maybeSingle();

      if (rankData) {
        setRank(rankData.current_rank);
        setPoints(rankData.total_points ?? 0);
      } else {
        setRank(null);
        setPoints(0);
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('sale_items')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .gte('created_at', startOfDay.toISOString());

      setSalesToday(count ?? 0);
    };
    load();
  }, [user?.id, currentWorkspaceId]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const links = PROFILE_LINKS.filter((link) => isEnabled(link.code));

  return (
    <ComponentGate code="CRM-0090" redirectTo="/(agent)">
      <SafeAreaView
        edges={['bottom']}
        style={{ flex: 1, minHeight: 0, backgroundColor: colors.canvas, padding: spacing.md }}
      >
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(agent)/more');
          }}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ marginBottom: spacing.sm, alignSelf: 'flex-start', padding: spacing.xs }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>

        <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
          <IconChip
            name="person"
            size={64}
            iconSize={32}
            backgroundColor={colors.primaryLight}
            color={colors.primary}
            style={{ marginBottom: spacing.sm }}
          />
          <AppText variant="h2" style={{ textAlign: 'center' }}>
            {displayName(user?.email)}
          </AppText>
          <AppText variant="secondary" style={{ marginTop: 4 }}>
            {today}
          </AppText>
          {currentWorkspaceLabel ? (
            <AppText variant="secondary" style={{ marginTop: 2 }}>
              {currentWorkspaceLabel}
            </AppText>
          ) : null}
        </View>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          <Card style={{ width: '48%', flexGrow: 1, minWidth: '45%', padding: spacing.md }}>
            <IconChip
              name="cart-outline"
              backgroundColor={colors.primaryLight}
              color={colors.primary}
              size={36}
              iconSize={18}
            />
            <AppText variant="h2" style={{ color: colors.primary, marginTop: spacing.sm }}>
              {salesToday}
            </AppText>
            <AppText variant="secondary" style={{ fontSize: 12 }}>
              Today&apos;s sales
            </AppText>
          </Card>
          <Card style={{ width: '48%', flexGrow: 1, minWidth: '45%', padding: spacing.md }}>
            <IconChip
              name="trophy-outline"
              backgroundColor={colors.primaryLight}
              color={colors.primary}
              size={36}
              iconSize={18}
            />
            <AppText variant="h2" style={{ marginTop: spacing.sm }} numberOfLines={1}>
              {rank ?? '—'}
            </AppText>
            <AppText variant="secondary" style={{ fontSize: 12 }}>
              {points} points
            </AppText>
          </Card>
        </View>

        <View style={{ marginBottom: spacing.md }}>
          <WorkHoursCard logs={statusLogs} loading={hoursLoading} />
        </View>

        <Card
          style={{
            flex: 1,
            padding: 0,
            marginBottom: spacing.md,
            // Avoid overflow:'hidden' + elevation — clips IconChips into
            // pale semicircle artifacts along the card edge on Android.
            elevation: 0,
            shadowOpacity: 0,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <AppText style={{ fontWeight: '700', fontSize: 16 }}>Account</AppText>
          </View>

          {user?.email ? (
            <View
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <AppText
                variant="secondary"
                style={{ fontSize: 12, letterSpacing: 0.5, marginBottom: 4 }}
              >
                EMAIL ADDRESS
              </AppText>
              <AppText style={{ flexShrink: 1, fontSize: 16 }}>{user.email}</AppText>
            </View>
          ) : null}

          <View style={{ flex: 1 }}>
            {links.map((link, index) => (
              <Pressable
                key={link.code}
                onPress={() => router.push(link.path as never)}
                hitSlop={hitSlop}
                accessibilityRole="button"
                accessibilityLabel={link.label}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 72,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  backgroundColor: pressed ? colors.muted : colors.card,
                  borderBottomWidth: index < links.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                })}
              >
                <IconChip
                  name={link.icon}
                  backgroundColor={colors.primaryLight}
                  color={colors.primary}
                  size={52}
                  iconSize={26}
                />
                <AppText
                  style={{
                    flex: 1,
                    flexShrink: 1,
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.foreground,
                  }}
                  numberOfLines={1}
                >
                  {link.label}
                </AppText>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={handleSignOut}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Logout"
            style={({ pressed }) => ({
              minHeight: 72,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              backgroundColor: pressed ? '#FFE5E3' : colors.card,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            })}
          >
            <IconChip
              name="log-out-outline"
              backgroundColor="#FFE5E3"
              color={colors.destructive}
              size={52}
              iconSize={26}
            />
            <AppText
              style={{
                flex: 1,
                fontSize: 16,
                fontWeight: '600',
                color: colors.destructive,
              }}
            >
              Logout
            </AppText>
          </Pressable>
        </Card>
      </SafeAreaView>
    </ComponentGate>
  );
}
