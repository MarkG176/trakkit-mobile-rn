import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ComponentGate } from '@/components/ComponentGate';
import { DailySummaryCard } from '@/components/profile/DailySummaryCard';
import { WeeklySummaryCard } from '@/components/profile/WeeklySummaryCard';
import { WorkHoursCard } from '@/components/dashboard/WorkHoursCard';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useAgentProfileStats } from '@/hooks/useAgentProfileStats';
import { AppText, Card, ListItemCard, LoadingSpinner } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { currentWorkspaceLabel } = useWorkspace();
  const router = useRouter();
  const stats = useAgentProfileStats();

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
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.md }}
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="h2" style={{ marginBottom: 4, flexShrink: 1 }}>
            {stats.displayName || user?.email?.split('@')[0] || 'Agent'}
          </AppText>
          <AppText variant="secondary" style={{ marginBottom: spacing.md, flexShrink: 1 }}>
            {today}
          </AppText>
          {currentWorkspaceLabel ? (
            <AppText variant="secondary" style={{ marginBottom: spacing.md, flexShrink: 1 }}>
              {currentWorkspaceLabel}
            </AppText>
          ) : null}

          {stats.isLoading ? (
            <LoadingSpinner label="Loading profile" />
          ) : (
            <>
              <DailySummaryCard
                storesAdded={stats.todayStoresAdded}
                sales={stats.todaySales}
                revenue={stats.todayRevenue}
                surveys={stats.todaySurveys}
                giveaways={stats.todayGiveaways}
                giveawayItems={stats.todayGiveawayItems}
                workMinutes={stats.todayWorkMinutes}
              />
              <WeeklySummaryCard
                storesAdded={stats.weekStoresAdded}
                sales={stats.weekSales}
                revenue={stats.weekRevenue}
                surveys={stats.weekSurveys}
                giveaways={stats.weekGiveaways}
                giveawayItems={stats.weekGiveawayItems}
                workMinutes={stats.weekWorkMinutes}
              />
              <Card style={{ marginBottom: spacing.md }}>
                <AppText variant="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Rank
                </AppText>
                <AppText variant="h2" style={{ marginTop: 4 }}>
                  {stats.currentRank ?? 'Unranked'}
                </AppText>
                <AppText variant="secondary">{stats.totalPoints} points</AppText>
              </Card>
              <View style={{ marginBottom: spacing.md }}>
                <WorkHoursCard />
              </View>
            </>
          )}

          <AppText variant="secondary" style={{ textTransform: 'uppercase', marginBottom: spacing.sm }}>
            Account
          </AppText>
          <ListItemCard
            title="Activity feed"
            onPress={() => router.push('/(agent)/activity')}
            trailing={<Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />}
          />
          <ListItemCard
            title="Settings"
            onPress={() => router.push('/(agent)/settings')}
            trailing={<Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />}
          />

          <TouchableOpacity onPress={handleSignOut} style={{ marginTop: spacing.md, minHeight: 44 }}>
            <AppText style={{ color: colors.destructive, fontWeight: '500', textAlign: 'center' }}>
              Sign out
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ComponentGate>
  );
}
