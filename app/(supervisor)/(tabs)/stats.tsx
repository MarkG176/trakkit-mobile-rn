import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { useAgentProfileStats } from '@/hooks/useAgentProfileStats';
import { supabase } from '@/lib/supabase';
import { formatCurrencySimple } from '@/utils/currency';
import { workspaceService } from '@/services/workspaceService';
import {
  AppText,
  Card,
  EmptyMessage,
  Input,
  LoadingSpinner,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';

type WorkspaceMember = {
  user_id: string;
  name: string | null;
  email: string | null;
};

type Period = 'today' | 'week' | 'alltime';

function formatWorkTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <AppText variant="secondary">{label}</AppText>
      <AppText style={{ fontWeight: '600' }}>{value}</AppText>
    </View>
  );
}

function memberLabel(m: WorkspaceMember): string {
  return m.name || m.email?.split('@')[0] || 'Select user';
}

export default function StatsScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const { isEnabled } = useProjectComponents();
  const currency = workspaceService.getProjectCurrencyCode();
  const isWholesale = isEnabled('CRM-0034');
  const isSeeding = isEnabled('CRM-0024') || isEnabled('CRM-0023');

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<Period>('today');

  const stats = useAgentProfileStats(selectedUserId || undefined);

  useEffect(() => {
    if (!currentWorkspaceId) return;
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('user_workspaces')
        .select('user_id, name, email')
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_deleted', false)
        .eq('is_active', true);
      if (data) {
        const cleaned = data.filter(
          (m): m is WorkspaceMember => typeof m.user_id === 'string' && !!m.user_id,
        );
        setMembers(cleaned);
        setSelectedUserId((prev) => {
          if (prev && cleaned.some((m) => m.user_id === prev)) return prev;
          return cleaned.length > 0 ? cleaned[0].user_id : null;
        });
      } else {
        setMembers([]);
        setSelectedUserId(null);
      }
    };
    void fetchMembers();
  }, [currentWorkspaceId]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q),
    );
  }, [members, searchQuery]);

  const selectedMember = members.find((m) => m.user_id === selectedUserId);
  const money = (n: number) => formatCurrencySimple(n, currency);

  return (
    <ComponentGate code="CRM-0124">
      <Screen scroll>
        <Pressable
          onPress={() => setPickerOpen((v) => !v)}
          hitSlop={hitSlop}
          style={{
            minHeight: 48,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            justifyContent: 'center',
            backgroundColor: colors.card,
            marginBottom: spacing.md,
          }}
        >
          <AppText style={{ fontWeight: '600' }}>
            {selectedMember ? memberLabel(selectedMember) : 'Select agent'}
          </AppText>
        </Pressable>

        {pickerOpen ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.md,
              backgroundColor: colors.card,
              marginBottom: spacing.md,
              padding: spacing.sm,
            }}
          >
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              containerStyle={{ marginBottom: spacing.sm }}
            />
            {filteredMembers.map((m) => (
              <Pressable
                key={m.user_id}
                onPress={() => {
                  setSelectedUserId(m.user_id);
                  setPickerOpen(false);
                }}
                hitSlop={hitSlop}
                style={{
                  minHeight: 44,
                  justifyContent: 'center',
                  paddingHorizontal: spacing.sm,
                  backgroundColor:
                    selectedUserId === m.user_id ? colors.primaryLight : 'transparent',
                  borderRadius: radius.sm,
                }}
              >
                <AppText style={{ fontWeight: '600' }}>{memberLabel(m)}</AppText>
                <AppText variant="secondary" style={{ fontSize: 12 }}>
                  {m.email}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.muted,
            borderRadius: radius.md,
            padding: 4,
            marginBottom: spacing.md,
          }}
        >
          {(
            [
              ['today', 'Today'],
              ['week', 'Week'],
              ['alltime', 'All Time'],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setPeriod(key)}
              hitSlop={hitSlop}
              style={{
                flex: 1,
                minHeight: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.sm,
                backgroundColor: period === key ? colors.card : 'transparent',
              }}
            >
              <AppText style={{ fontWeight: period === key ? '700' : '500', fontSize: 13 }}>
                {label}
              </AppText>
            </Pressable>
          ))}
        </View>

        {!selectedUserId ? (
          <EmptyMessage>Select an agent to view stats.</EmptyMessage>
        ) : stats.isLoading ? (
          <LoadingSpinner label="Loading stats" />
        ) : (
          <>
            {period === 'today' ? (
              <>
                <Card style={{ marginBottom: spacing.md, padding: spacing.md }}>
                  <SectionHeader title="Activity & attendance" />
                  {!isWholesale && !isSeeding ? (
                    <MetricRow label="Check-ins" value={stats.todayCheckIns} />
                  ) : null}
                  <MetricRow
                    label="Work time"
                    value={formatWorkTime(stats.todayWorkMinutes)}
                  />
                  {!isWholesale && !isSeeding ? (
                    <MetricRow label="Store visits" value={stats.todayStoreVisits} />
                  ) : null}
                  {isSeeding ? (
                    <MetricRow label="Stores added" value={stats.todayStoresAdded} />
                  ) : null}
                </Card>
                <Card style={{ marginBottom: spacing.md, padding: spacing.md }}>
                  <SectionHeader title="Sales & revenue" />
                  {isWholesale ? (
                    <>
                      <MetricRow label="Products sold" value={stats.todayWholesaleSales} />
                      <MetricRow label="Revenue" value={money(stats.todayWholesaleRevenue)} />
                    </>
                  ) : (
                    <>
                      <MetricRow label="Sales made" value={stats.todaySales} />
                      <MetricRow label="Revenue" value={money(stats.todayRevenue)} />
                    </>
                  )}
                </Card>
                <Card style={{ marginBottom: spacing.md, padding: spacing.md }}>
                  <SectionHeader title="Engagement" />
                  {!isWholesale || isSeeding ? (
                    <MetricRow label="Interactions" value={stats.todayInteractionsCount} />
                  ) : null}
                  {!isWholesale || stats.hasSurveyAssigned || isSeeding ? (
                    <MetricRow label="Surveys done" value={stats.todaySurveys} />
                  ) : null}
                  {!isSeeding ? (
                    <MetricRow label="Giveaways" value={stats.todayGiveaways} />
                  ) : null}
                  {!isSeeding ? (
                    <MetricRow label="Notes" value={stats.todayNotesCount} />
                  ) : null}
                </Card>
              </>
            ) : null}

            {period === 'week' ? (
              <>
                <Card style={{ marginBottom: spacing.md, padding: spacing.md }}>
                  <SectionHeader title="Activity & attendance" />
                  {!isWholesale && !isSeeding ? (
                    <MetricRow label="Check-ins" value={stats.weekCheckIns} />
                  ) : null}
                  <MetricRow label="Work time" value={formatWorkTime(stats.weekWorkMinutes)} />
                  {!isWholesale && !isSeeding ? (
                    <MetricRow label="Store visits" value={stats.weekStoreVisits} />
                  ) : null}
                  {isSeeding ? (
                    <MetricRow label="Stores added" value={stats.weekStoresAdded} />
                  ) : null}
                </Card>
                <Card style={{ marginBottom: spacing.md, padding: spacing.md }}>
                  <SectionHeader title="Sales & revenue" />
                  {isWholesale ? (
                    <>
                      <MetricRow label="Products sold" value={stats.weekWholesaleSales} />
                      <MetricRow label="Revenue" value={money(stats.weekWholesaleRevenue)} />
                    </>
                  ) : (
                    <>
                      <MetricRow label="Sales made" value={stats.weekSales} />
                      <MetricRow label="Revenue" value={money(stats.weekRevenue)} />
                    </>
                  )}
                </Card>
                <Card style={{ marginBottom: spacing.md, padding: spacing.md }}>
                  <SectionHeader title="Engagement" />
                  {!isWholesale || isSeeding ? (
                    <MetricRow label="Interactions" value={stats.weekInteractionsCount} />
                  ) : null}
                  {!isWholesale || stats.hasSurveyAssigned || isSeeding ? (
                    <MetricRow label="Surveys done" value={stats.weekSurveys} />
                  ) : null}
                  {!isSeeding ? <MetricRow label="Giveaways" value={stats.weekGiveaways} /> : null}
                  {!isWholesale && !isSeeding ? (
                    <>
                      <MetricRow label="Rank" value={stats.currentRank} />
                      <MetricRow label="Weekly points" value={stats.weeklyPoints} />
                    </>
                  ) : null}
                </Card>
              </>
            ) : null}

            {period === 'alltime' ? (
              <>
                <Card style={{ marginBottom: spacing.md, padding: spacing.md }}>
                  <SectionHeader title="Activity & attendance" />
                  {!isWholesale && !isSeeding ? (
                    <MetricRow label="Check-ins" value={stats.allTimeCheckIns} />
                  ) : null}
                  {!isWholesale && !isSeeding ? (
                    <MetricRow label="Store visits" value={stats.allTimeStoreVisits} />
                  ) : null}
                  {isSeeding ? (
                    <MetricRow label="Stores added" value={stats.allTimeStoresAdded} />
                  ) : null}
                </Card>
                <Card style={{ marginBottom: spacing.md, padding: spacing.md }}>
                  <SectionHeader title="Sales & revenue" />
                  {isWholesale ? (
                    <>
                      <MetricRow label="Products sold" value={stats.allTimeWholesaleSales} />
                      <MetricRow label="Revenue" value={money(stats.allTimeWholesaleRevenue)} />
                    </>
                  ) : (
                    <>
                      <MetricRow label="Sales made" value={stats.allTimeSales} />
                      <MetricRow label="Revenue" value={money(stats.allTimeRevenue)} />
                    </>
                  )}
                </Card>
                <Card style={{ marginBottom: spacing.md, padding: spacing.md }}>
                  <SectionHeader title="Engagement" />
                  {!isWholesale || isSeeding ? (
                    <MetricRow label="Interactions" value={stats.allTimeInteractionsCount} />
                  ) : null}
                  {!isWholesale || stats.hasSurveyAssigned || isSeeding ? (
                    <MetricRow label="Surveys done" value={stats.allTimeSurveys} />
                  ) : null}
                  {!isSeeding ? (
                    <MetricRow label="Giveaways" value={stats.allTimeGiveaways} />
                  ) : null}
                  {!isWholesale && !isSeeding ? (
                    <>
                      <MetricRow label="Rank" value={stats.currentRank} />
                      <MetricRow label="Total points" value={stats.totalPoints} />
                    </>
                  ) : null}
                </Card>
              </>
            ) : null}
          </>
        )}
      </Screen>
    </ComponentGate>
  );
}
