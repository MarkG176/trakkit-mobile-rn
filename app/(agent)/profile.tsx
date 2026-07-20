// [CRM-0090] Profile — agent profile summaries, check-ins & surveys sheets
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { format, parseISO } from 'date-fns';
import {
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Gift,
  LogOut,
  ShoppingCart,
  X,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { DailySummary } from '@/components/cards';
import { WorkHoursCard } from '@/components/dashboard/WorkHoursCard';
import { useAgentDashboardData } from '@/hooks/useAgentDashboardData';
import { useLanguage } from '@/hooks/useLanguage';
import { AppText, Card, EmptyMessage, LoadingSpinner } from '@/components/ui';
import { colors, font, hitSlop, radius, spacing } from '@/theme';

const APP_VERSION =
  Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '1.0.0';

type SheetKind = 'checkins' | 'surveys' | null;

type CheckInRow = {
  id: string;
  timestamp: string;
  selfie_url: string | null;
  store_name: string | null;
  in_range: boolean | null;
};

type SurveyRow = {
  id: string;
  created_at: string | null;
};

function displayName(email?: string | null, metaName?: string | null): string {
  if (metaName?.trim()) return metaName.trim();
  if (!email) return 'Agent';
  const local = email.split('@')[0] ?? email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function MetricRow({
  label,
  value,
  icon,
  onPress,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  onPress?: () => void;
}) {
  const row = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
        {icon}
        <AppText variant="secondary">{label}</AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <AppText style={{ fontWeight: '600' }}>{value}</AppText>
        {onPress ? <ChevronRight size={16} color={colors.mutedForeground} /> : null}
      </View>
    </View>
  );

  if (!onPress) return row;
  return (
    <Pressable onPress={onPress} hitSlop={hitSlop}>
      {row}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { currentWorkspaceId, currentWorkspaceLabel } = useWorkspace();
  const router = useRouter();
  const { t } = useLanguage();
  const { statusLogs, loading: hoursLoading } = useAgentDashboardData();

  const [rank, setRank] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [giveawaysCount, setGiveawaysCount] = useState(0);
  const [surveysCount, setSurveysCount] = useState(0);
  const [checkInsCount, setCheckInsCount] = useState(0);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [checkIns, setCheckIns] = useState<CheckInRow[]>([]);
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);

  const name = displayName(
    user?.email,
    (user?.user_metadata?.display_name as string | undefined) ??
      (user?.user_metadata?.full_name as string | undefined),
  );
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    const load = async () => {
      if (!user || !currentWorkspaceId) return;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startIso = startOfDay.toISOString();

      const [rankRes, salesRes, giveawaysRes, surveysRes, checkInsRes] = await Promise.all([
        supabase
          .from('agent_ranks')
          .select('current_rank, total_points')
          .eq('agent_id', user.id)
          .maybeSingle(),
        supabase
          .from('interactions')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('interaction_type', 'sale')
          .gte('created_at', startIso),
        supabase
          .from('giveaways')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', startIso),
        supabase
          .from('survey_responses')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', startIso),
        supabase
          .from('agent_status_log')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('status', 'checked_in')
          .gte('timestamp', startIso),
      ]);

      if (rankRes.data) {
        setRank(rankRes.data.current_rank);
        setPoints(rankRes.data.total_points ?? 0);
      }
      setSalesCount(salesRes.count ?? 0);
      setGiveawaysCount(giveawaysRes.count ?? 0);
      setSurveysCount(surveysRes.count ?? 0);
      setCheckInsCount(checkInsRes.count ?? 0);
    };
    void load();
  }, [user?.id, currentWorkspaceId]);

  const openCheckIns = useCallback(async () => {
    if (!user || !currentWorkspaceId) return;
    setSheet('checkins');
    setSheetLoading(true);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('agent_status_log')
      .select(
        'id, timestamp, selfie_url, in_range, stores:store_id(store_name)',
      )
      .eq('agent_id', user.id)
      .eq('workspace_id', currentWorkspaceId)
      .eq('status', 'checked_in')
      .gte('timestamp', start.toISOString())
      .order('timestamp', { ascending: false })
      .limit(50);

    setCheckIns(
      (data ?? []).map((row: any) => ({
        id: row.id,
        timestamp: row.timestamp,
        selfie_url: row.selfie_url,
        in_range: row.in_range,
        store_name: row.stores?.store_name ?? null,
      })),
    );
    setSheetLoading(false);
  }, [user, currentWorkspaceId]);

  const openSurveys = useCallback(async () => {
    if (!user || !currentWorkspaceId) return;
    setSheet('surveys');
    setSheetLoading(true);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('survey_responses')
      .select('id, created_at')
      .eq('agent_id', user.id)
      .eq('workspace_id', currentWorkspaceId)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);
    setSurveys(data ?? []);
    setSheetLoading(false);
  }, [user, currentWorkspaceId]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ComponentGate code="CRM-0090" redirectTo="/(agent)">
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.lg,
              paddingBottom: spacing.xl,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: radius.full,
                  borderWidth: 3,
                  borderColor: colors.primaryForeground,
                  backgroundColor: colors.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppText
                  style={{
                    fontSize: 24,
                    fontFamily: font.bold,
                    fontWeight: '700',
                    color: colors.primary,
                  }}
                >
                  {initials}
                </AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText
                  style={{
                    fontSize: 22,
                    fontFamily: font.bold,
                    fontWeight: '700',
                    color: colors.primaryForeground,
                  }}
                >
                  {name}
                </AppText>
                <AppText style={{ color: colors.primaryForeground, opacity: 0.85, marginTop: 2 }}>
                  {today}
                </AppText>
                {currentWorkspaceLabel ? (
                  <AppText
                    style={{
                      color: colors.primaryForeground,
                      opacity: 0.9,
                      marginTop: 4,
                      fontWeight: '500',
                    }}
                  >
                    {currentWorkspaceLabel}
                  </AppText>
                ) : null}
              </View>
            </View>
            <AppText
              style={{
                position: 'absolute',
                right: spacing.md,
                bottom: spacing.sm,
                fontSize: 10,
                color: colors.primaryForeground,
                opacity: 0.45,
              }}
            >
              v{APP_VERSION}
            </AppText>
          </View>

          <View style={{ padding: spacing.md, gap: spacing.md, marginTop: -spacing.md }}>
            <DailySummary
              dateLabel={today}
              salesCount={salesCount}
              giveaways={giveawaysCount}
              checkIns={checkInsCount}
            />

            <Card>
              <AppText
                variant="secondary"
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: spacing.sm,
                }}
              >
                {t('today')}
              </AppText>
              <MetricRow
                label={t('sales_made')}
                value={salesCount}
                icon={<ShoppingCart size={16} color={colors.mutedForeground} />}
              />
              <MetricRow
                label={t('giveaways')}
                value={giveawaysCount}
                icon={<Gift size={16} color={colors.mutedForeground} />}
              />
              <MetricRow
                label={t('surveys_done')}
                value={surveysCount}
                icon={<ClipboardList size={16} color={colors.mutedForeground} />}
                onPress={openSurveys}
              />
              <MetricRow
                label={t('check_ins')}
                value={checkInsCount}
                icon={<CheckCircle size={16} color={colors.mutedForeground} />}
                onPress={openCheckIns}
              />
            </Card>

            <Card>
              <AppText
                variant="secondary"
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {t('rank')}
              </AppText>
              <AppText variant="h2" style={{ marginTop: 4, fontFamily: font.bold }}>
                {rank ?? 'Unranked'}
              </AppText>
              <AppText variant="secondary">
                {points} {t('total_points').toLowerCase()}
              </AppText>
            </Card>

            <WorkHoursCard logs={statusLogs} loading={hoursLoading} />

            <Pressable
              onPress={handleSignOut}
              hitSlop={hitSlop}
              style={{
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                marginTop: spacing.sm,
              }}
            >
              <LogOut size={18} color={colors.destructive} />
              <AppText style={{ color: colors.destructive, fontWeight: '500' }}>
                {t('logout')}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>

        <Modal
          visible={sheet != null}
          animationType="slide"
          transparent
          onRequestClose={() => setSheet(null)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: radius.lg,
                borderTopRightRadius: radius.lg,
                maxHeight: '80%',
                paddingBottom: spacing.lg,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <AppText style={{ fontWeight: '700', fontSize: 18 }}>
                  {sheet === 'checkins' ? "Today's check-ins" : "Today's surveys"}
                </AppText>
                <Pressable onPress={() => setSheet(null)} hitSlop={hitSlop}>
                  <X size={22} color={colors.foreground} />
                </Pressable>
              </View>

              {sheetLoading ? (
                <LoadingSpinner label="Loading" />
              ) : sheet === 'checkins' ? (
                checkIns.length === 0 ? (
                  <EmptyMessage>No check-ins today.</EmptyMessage>
                ) : (
                  <FlatList
                    data={checkIns}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: spacing.md }}
                    renderItem={({ item }) => (
                      <View
                        style={{
                          flexDirection: 'row',
                          gap: spacing.md,
                          padding: spacing.md,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: radius.md,
                          marginBottom: spacing.sm,
                          backgroundColor: colors.muted,
                        }}
                      >
                        {item.selfie_url ? (
                          <Image
                            source={{ uri: item.selfie_url }}
                            style={{ width: 56, height: 56, borderRadius: radius.sm }}
                          />
                        ) : (
                          <View
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: radius.sm,
                              backgroundColor: colors.primaryLight,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <CheckCircle size={22} color={colors.primary} />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <AppText style={{ fontWeight: '600' }}>
                            {item.store_name || 'Check-in'}
                          </AppText>
                          <AppText variant="secondary" style={{ fontSize: 12, marginTop: 2 }}>
                            {format(parseISO(item.timestamp), 'MMM d · HH:mm')}
                          </AppText>
                          {item.in_range != null ? (
                            <AppText
                              style={{
                                fontSize: 12,
                                marginTop: 4,
                                color: item.in_range ? colors.success : colors.warning,
                              }}
                            >
                              {item.in_range ? 'In range' : 'Out of range'}
                            </AppText>
                          ) : null}
                        </View>
                      </View>
                    )}
                  />
                )
              ) : surveys.length === 0 ? (
                <EmptyMessage>No surveys today.</EmptyMessage>
              ) : (
                <FlatList
                  data={surveys}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ padding: spacing.md }}
                  renderItem={({ item }) => (
                    <View
                      style={{
                        padding: spacing.md,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radius.md,
                        marginBottom: spacing.sm,
                        backgroundColor: colors.muted,
                      }}
                    >
                      <AppText style={{ fontWeight: '600' }}>Survey response</AppText>
                      <AppText variant="secondary" style={{ fontSize: 12, marginTop: 2 }}>
                        {item.created_at
                          ? format(parseISO(item.created_at), 'MMM d · HH:mm')
                          : '—'}
                      </AppText>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      </View>
    </ComponentGate>
  );
}
