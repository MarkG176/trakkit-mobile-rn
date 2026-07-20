// [CRM-0111] Manage Agents — workspace agents with names, emails, role badges
import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Users } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import {
  AppText,
  Badge,
  EmptyMessage,
  LoadingSpinner,
  Screen,
} from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type AgentRow = {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  role: string;
};

function roleBadgeVariant(
  role: string,
): 'primary' | 'secondary' | 'success' | 'warning' {
  const r = role.toLowerCase();
  if (r.includes('admin') || r.includes('supervisor')) return 'warning';
  if (r.includes('agent')) return 'primary';
  if (r.includes('viewer')) return 'secondary';
  return 'success';
}

export default function ManageAgentsScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentWorkspaceId) {
        setAgents([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: workspaceUsers, error } = await supabase
          .from('user_workspaces')
          .select('id, user_id, name, email, role')
          .eq('workspace_id', currentWorkspaceId)
          .or('is_deleted.eq.false,is_deleted.is.null')
          .eq('is_active', true);

        if (error) throw error;

        let rows: AgentRow[] = (workspaceUsers ?? []).map((row) => ({
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          email: row.email,
          role: row.role || 'member',
        }));

        const userIds = rows.map((r) => r.user_id).filter(Boolean) as string[];
        if (userIds.length > 0) {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('user_id, display_name, email, role')
            .eq('workspace_id', currentWorkspaceId)
            .in('user_id', userIds);

          const byUser = new Map(
            (roles ?? []).map((r) => [r.user_id, r]),
          );
          rows = rows.map((row) => {
            const role = row.user_id ? byUser.get(row.user_id) : undefined;
            return {
              ...row,
              name: role?.display_name || row.name,
              email: role?.email || row.email,
              role: role?.role || row.role,
            };
          });
        }

        rows.sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || ''));
        setAgents(rows);
      } catch (err) {
        console.error('Failed to load agents', err);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0111">
      <Screen>
        {loading ? (
          <LoadingSpinner label="Loading team" />
        ) : agents.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
            <Users size={48} color={colors.mutedForeground} />
            <EmptyMessage>No agents in this workspace.</EmptyMessage>
          </View>
        ) : (
          <FlatList
            data={agents}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.lg }}
            renderItem={({ item }) => {
              const label = item.name || item.email || 'Unknown agent';
              const initials = label
                .split(/\s+/)
                .map((p) => p[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              return (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    minHeight: 72,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.full,
                      backgroundColor: colors.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppText style={{ fontWeight: '700', color: colors.primary }}>
                      {initials}
                    </AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText style={{ fontWeight: '600' }} numberOfLines={1}>
                      {label}
                    </AppText>
                    {item.email && item.name ? (
                      <AppText variant="secondary" style={{ fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                        {item.email}
                      </AppText>
                    ) : null}
                  </View>
                  <Badge variant={roleBadgeVariant(item.role)}>
                    {item.role.replace(/_/g, ' ')}
                  </Badge>
                </View>
              );
            }}
          />
        )}
      </Screen>
    </ComponentGate>
  );
}
