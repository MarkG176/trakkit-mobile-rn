import { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { WorkHoursCard } from '@/components/dashboard/WorkHoursCard';
import { useAgentDashboardData } from '@/hooks/useAgentDashboardData';
import { AppText, Card, ListItemCard } from '@/components/ui';
import { colors, spacing } from '@/theme';

function displayName(email?: string | null): string {
  if (!email) return 'Agent';
  const local = email.split('@')[0] ?? email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { currentWorkspaceId, currentWorkspaceLabel } = useWorkspace();
  const router = useRouter();
  const { statusLogs, loading: hoursLoading } = useAgentDashboardData();
  const [rank, setRank] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [salesToday, setSalesToday] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data: rankData } = await supabase
        .from('agent_ranks')
        .select('current_rank, total_points')
        .eq('agent_id', user.id)
        .maybeSingle();

      if (rankData) {
        setRank(rankData.current_rank);
        setPoints(rankData.total_points ?? 0);
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('sale_items')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', user.id)
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

  return (
    <ComponentGate code="CRM-0090" redirectTo="/(agent)">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.md }}
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="h2" style={{ marginBottom: 4 }}>{displayName(user?.email)}</AppText>
          <AppText variant="secondary" style={{ marginBottom: spacing.md }}>{today}</AppText>
          {currentWorkspaceLabel ? (
            <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
              {currentWorkspaceLabel}
            </AppText>
          ) : null}
          <Card style={{ marginBottom: spacing.md }}>
            <AppText variant="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Today&apos;s sales
            </AppText>
            <AppText variant="h2" style={{ color: colors.primary, marginTop: 4 }}>{salesToday}</AppText>
          </Card>

          <Card style={{ marginBottom: spacing.md }}>
            <AppText variant="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Rank
            </AppText>
            <AppText variant="h2" style={{ marginTop: 4 }}>{rank ?? 'Unranked'}</AppText>
            <AppText variant="secondary">{points} points</AppText>
          </Card>

          <View style={{ marginBottom: spacing.md }}>
            <WorkHoursCard logs={statusLogs} loading={hoursLoading} />
          </View>

          <AppText variant="secondary" style={{ textTransform: 'uppercase', marginBottom: spacing.sm }}>
            Account
          </AppText>
          <ListItemCard title="More" onPress={() => router.push('/(agent)/more')} trailing={<Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />} />
          <ListItemCard title="Activity feed" onPress={() => router.push('/(agent)/activity')} trailing={<Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />} />
          <ListItemCard title="Settings" onPress={() => router.push('/(agent)/settings')} trailing={<Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />} />

          <TouchableOpacity onPress={handleSignOut} style={{ marginTop: spacing.md }}>
            <AppText style={{ color: colors.destructive, fontWeight: '500', textAlign: 'center' }}>
              Sign out
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ComponentGate>
  );
}
