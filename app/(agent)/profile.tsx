import { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { AppText, Card } from '@/components/ui';
import { badge, colors, spacing } from '@/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const router = useRouter();
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

  const menuItem = (label: string, onPress: () => void) => (
    <TouchableOpacity onPress={onPress}>
      <Card style={{ marginBottom: spacing.md }}>
        <AppText style={{ fontWeight: '500' }}>{label}</AppText>
      </Card>
    </TouchableOpacity>
  );

  return (
    <ComponentGate code="CRM-0090" redirectTo="/(agent)">
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.muted }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing['2xl'] }}
      >
        <AppText variant="h2" style={{ marginBottom: spacing.xs }}>{user?.email}</AppText>
        <AppText variant="secondary" style={{ marginBottom: spacing['2xl'] }}>Agent profile</AppText>

        <Card style={{ marginBottom: spacing.lg }}>
          <AppText variant="secondary">Today&apos;s sales</AppText>
          <AppText variant="h2" style={{ color: colors.primary }}>{salesToday}</AppText>
        </Card>

        <Card style={{ marginBottom: spacing.lg }}>
          <AppText variant="secondary">Rank</AppText>
          <AppText variant="h2">{rank ?? 'Unranked'}</AppText>
          <AppText variant="secondary">{points} points</AppText>
        </Card>

        {menuItem('More', () => router.push('/(agent)/more'))}
        {menuItem('Activity feed', () => router.push('/(agent)/activity'))}
        {menuItem('Settings', () => router.push('/(agent)/settings'))}

        <TouchableOpacity onPress={handleSignOut}>
          <Card style={{ ...badge.destructive, borderColor: badge.destructive.backgroundColor }}>
            <AppText style={badge.destructiveText}>Sign out</AppText>
          </Card>
        </TouchableOpacity>
      </ScrollView>
    </ComponentGate>
  );
}
