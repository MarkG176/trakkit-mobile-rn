import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner, EmptyMessage, AppText, Card, IconChip } from '@/components/ui';
import { colors, spacing } from '@/theme';

type Member = { id: string; agent_id: string | null };

export default function ManageAgentsScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentWorkspaceId) return;
      const { data } = await supabase
        .from('team_members')
        .select('id, agent_id')
        .eq('workspace_id', currentWorkspaceId);

      setMembers(data ?? []);
      setLoading(false);
    };
    load();
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0111">
      <Screen scroll showBack>
        {loading ? (
          <LoadingSpinner label="Loading team" />
        ) : members.length === 0 ? (
          <EmptyMessage>No agents on this team.</EmptyMessage>
        ) : (
          members.map((m) => (
            <Card key={m.id} style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <IconChip
                  name="person-outline"
                  backgroundColor={colors.primaryLight}
                  color={colors.primary}
                />
                <View style={{ flex: 1, flexShrink: 1 }}>
                  <AppText style={{ fontWeight: '600', fontSize: 16 }}>
                    Agent {m.agent_id?.slice(0, 8) ?? 'Unknown'}
                  </AppText>
                  <AppText variant="secondary" style={{ marginTop: 2, fontSize: 13 }}>
                    Team member
                  </AppText>
                </View>
              </View>
            </Card>
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
