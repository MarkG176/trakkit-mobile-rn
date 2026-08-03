import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { WorkHoursCard } from '@/components/dashboard/WorkHoursCard';
import { DailySummaryCard, WeeklySummaryCard } from '@/components/profile/SummaryCards';
import {
  ProfileIdentityCard,
  displayNameFromEmail,
  formatProfileDate,
} from '@/components/profile/ProfileIdentityCard';
import { useAgentDashboardData, calculateTodayHours } from '@/hooks/useAgentDashboardData';
import { formatCurrencySimple } from '@/utils/currency';
import { workspaceService } from '@/services/workspaceService';
import { AppText, Card, IconChip } from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

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

function startOfWeekIso(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d.toISOString();
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { isEnabled } = useProjectComponents();
  const router = useRouter();
  const { statusLogs, loading: hoursLoading } = useAgentDashboardData();
  const [rank, setRank] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [salesToday, setSalesToday] = useState(0);
  const [todayMetrics, setTodayMetrics] = useState({
    sales: 0,
    revenue: 0,
    surveys: 0,
    giveaways: 0,
    giveawayItems: 0,
    storesAdded: 0,
  });
  const [weekMetrics, setWeekMetrics] = useState({
    sales: 0,
    revenue: 0,
    surveys: 0,
    giveaways: 0,
    giveawayItems: 0,
    storesAdded: 0,
  });

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
      const todayIso = startOfDay.toISOString();
      const weekIso = startOfWeekIso();

      const [
        salesTodayRes,
        salesWeekRes,
        surveysTodayRes,
        surveysWeekRes,
        giveawaysTodayRes,
        giveawaysWeekRes,
        storesTodayRes,
        storesWeekRes,
      ] = await Promise.all([
        supabase
          .from('sale_items')
          .select('total_price')
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', todayIso),
        supabase
          .from('sale_items')
          .select('total_price')
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', weekIso),
        supabase
          .from('survey_responses')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', todayIso),
        supabase
          .from('survey_responses')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', weekIso),
        supabase
          .from('giveaways')
          .select('total_items')
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', todayIso),
        supabase
          .from('giveaways')
          .select('total_items')
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', weekIso),
        supabase
          .from('stores')
          .select('id', { count: 'exact', head: true })
          .eq('added_by', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', todayIso),
        supabase
          .from('stores')
          .select('id', { count: 'exact', head: true })
          .eq('added_by', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', weekIso),
      ]);

      const todaySales = salesTodayRes.data ?? [];
      const weekSales = salesWeekRes.data ?? [];
      const todayGives = giveawaysTodayRes.data ?? [];
      const weekGives = giveawaysWeekRes.data ?? [];

      setSalesToday(todaySales.length);
      setTodayMetrics({
        sales: todaySales.length,
        revenue: todaySales.reduce((s, r) => s + (r.total_price ?? 0), 0),
        surveys: surveysTodayRes.count ?? 0,
        giveaways: todayGives.length,
        giveawayItems: todayGives.reduce((s, r) => s + (r.total_items ?? 0), 0),
        storesAdded: storesTodayRes.count ?? 0,
      });
      setWeekMetrics({
        sales: weekSales.length,
        revenue: weekSales.reduce((s, r) => s + (r.total_price ?? 0), 0),
        surveys: surveysWeekRes.count ?? 0,
        giveaways: weekGives.length,
        giveawayItems: weekGives.reduce((s, r) => s + (r.total_items ?? 0), 0),
        storesAdded: storesWeekRes.count ?? 0,
      });
    };
    load();
  }, [user?.id, currentWorkspaceId]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const links = PROFILE_LINKS.filter((link) => isEnabled(link.code));
  const currency = workspaceService.getProjectCurrencyCode();
  const workHours = calculateTodayHours(statusLogs);
  const workLabel = `${Math.floor(workHours)}h ${Math.round((workHours % 1) * 60)}m`;

  return (
    <ComponentGate code="CRM-0090" redirectTo="/(agent)">
      <SafeAreaView
        edges={['bottom']}
        style={{ flex: 1, minHeight: 0, backgroundColor: colors.canvas }}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
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

          <ProfileIdentityCard
            name={displayNameFromEmail(user?.email)}
            dateLabel={formatProfileDate()}
            style={{ marginBottom: spacing.md }}
          />

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

          <DailySummaryCard
            metrics={{
              ...todayMetrics,
              workLabel,
              revenueLabel: formatCurrencySimple(todayMetrics.revenue, currency),
            }}
          />
          <WeeklySummaryCard
            metrics={{
              ...weekMetrics,
              workLabel,
              revenueLabel: formatCurrencySimple(weekMetrics.revenue, currency),
            }}
          />

          <View style={{ marginBottom: spacing.md }}>
            <WorkHoursCard logs={statusLogs} loading={hoursLoading} />
          </View>

          <Card
            style={{
              padding: 0,
              marginBottom: spacing.md,
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

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
                gap: spacing.md,
              }}
            >
              {links.map((link) => (
                <Pressable
                  key={link.code}
                  onPress={() => router.push(link.path as never)}
                  hitSlop={hitSlop}
                  accessibilityRole="button"
                  accessibilityLabel={link.label}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: 'center',
                    minWidth: 0,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: radius.md,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: spacing.sm,
                    }}
                  >
                    <Ionicons name={link.icon} size={28} color={colors.primaryForeground} />
                  </View>
                  <AppText
                    style={{
                      width: '100%',
                      fontSize: 12,
                      fontWeight: '500',
                      color: colors.foreground,
                      textAlign: 'center',
                      lineHeight: 16,
                    }}
                  >
                    {link.label}
                  </AppText>
                </Pressable>
              ))}
              <Pressable
                onPress={handleSignOut}
                hitSlop={hitSlop}
                accessibilityRole="button"
                accessibilityLabel="Logout"
                style={({ pressed }) => ({
                  flex: 1,
                  alignItems: 'center',
                  minWidth: 0,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: radius.md,
                    backgroundColor: colors.destructive,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.sm,
                  }}
                >
                  <Ionicons name="log-out-outline" size={28} color={colors.primaryForeground} />
                </View>
                <AppText
                  style={{
                    width: '100%',
                    fontSize: 12,
                    fontWeight: '500',
                    color: colors.foreground,
                    textAlign: 'center',
                    lineHeight: 16,
                  }}
                >
                  Logout
                </AppText>
              </Pressable>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ComponentGate>
  );
}
