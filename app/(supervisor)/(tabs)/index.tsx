import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import {
  LoadingSpinner,
  EmptyMessage,
  ListItemCard,
  Badge,
  SectionHeader,
  AppText,
} from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

interface AgentStatus {
  id: string;
  agent_id: string;
  status: string;
  timestamp: string;
}

const SECONDARY_LINKS: {
  code: string;
  label: string;
  path: `/(supervisor)/${string}`;
  icon: IoniconName;
}[] = [
  { code: 'CRM-0121', label: 'Sales', path: '/(supervisor)/sales', icon: 'cart' },
  { code: 'CRM-0120', label: 'Gallery', path: '/(supervisor)/gallery', icon: 'images' },
  { code: 'CRM-0122', label: 'Rankings', path: '/(supervisor)/rankings', icon: 'trophy' },
  { code: 'CRM-0119', label: 'Feedback', path: '/(supervisor)/feedback', icon: 'chatbubble-ellipses' },
];

function statusBadgeVariant(status: string): 'success' | 'destructive' | 'warning' | 'primary' {
  if (status === 'checked_in') return 'success';
  if (status === 'checked_out') return 'destructive';
  if (status === 'lunch') return 'warning';
  return 'primary';
}

export default function SupervisorDashboard() {
  const router = useRouter();
  const { currentWorkspaceId } = useWorkspace();
  const { isEnabled } = useProjectComponents();
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const visibleLinks = SECONDARY_LINKS.filter((link) => isEnabled(link.code));

  useEffect(() => {
    if (!currentWorkspaceId) return;

    const load = async () => {
      const { data } = await supabase
        .from('agent_status_log')
        .select('id, agent_id, status, timestamp')
        .eq('workspace_id', currentWorkspaceId)
        .order('timestamp', { ascending: false })
        .limit(20);

      setAgents(
        (data ?? []).map((row) => ({
          id: row.id,
          agent_id: row.agent_id,
          status: row.status,
          timestamp: row.timestamp,
        })),
      );
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`supervisor-status-${currentWorkspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_status_log',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        (payload) => {
          const row = payload.new as AgentStatus;
          setAgents((prev) => [row, ...prev].slice(0, 20));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0118" redirectTo="/(agent)">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          showsVerticalScrollIndicator={false}
        >
          {visibleLinks.length > 0 ? (
            <View>
              <SectionHeader title="Workspace" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {visibleLinks.map((link) => (
                  <Pressable
                    key={link.code}
                    onPress={() => router.push(link.path as never)}
                    hitSlop={hitSlop}
                    style={({ pressed }) => ({
                      minHeight: 48,
                      minWidth: '45%',
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.md,
                      backgroundColor: pressed ? colors.muted : colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                    })}
                  >
                    <Ionicons name={link.icon} size={20} color={colors.foreground} />
                    <AppText style={{ fontSize: 16, fontWeight: '500' }}>{link.label}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View>
            <SectionHeader title="Live agent activity" />
            {loading ? (
              <LoadingSpinner label="Loading activity" />
            ) : agents.length === 0 ? (
              <EmptyMessage>No recent agent activity.</EmptyMessage>
            ) : (
              agents.map((a) => (
                <ListItemCard
                  key={a.id}
                  title={`${a.agent_id.slice(0, 8)}…`}
                  subtitle={new Date(a.timestamp).toLocaleString()}
                  trailing={
                    <Badge variant={statusBadgeVariant(a.status)}>
                      {a.status.replace(/_/g, ' ')}
                    </Badge>
                  }
                />
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </ComponentGate>
  );
}
