import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import {
  AppText,
  Badge,
  EmptyMessage,
  ListItemCard,
  LoadingSpinner,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { colors, hitSlop, spacing } from '@/theme';

type Giveaway = {
  id: string;
  recorded_at: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  products_given: unknown;
  total_items: number;
  engagement_quality: string | null;
  follow_up_required: boolean | null;
  agent_id: string | null;
};

function productsLabel(products: unknown): string {
  if (!products) return '—';
  if (Array.isArray(products)) {
    return products
      .map((p) => {
        if (typeof p === 'string') return p;
        if (p && typeof p === 'object' && 'name' in p) return String((p as { name: string }).name);
        return null;
      })
      .filter(Boolean)
      .join(', ');
  }
  if (typeof products === 'object') return JSON.stringify(products);
  return String(products);
}

export default function SupervisorGiveawaysScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [selected, setSelected] = useState<Giveaway | null>(null);
  const [nameByAgent, setNameByAgent] = useState<Record<string, string>>({});

  const { data: giveaways = [], isLoading } = useQuery({
    queryKey: ['mobile-giveaways', currentWorkspaceId],
    queryFn: async (): Promise<Giveaway[]> => {
      const { data, error } = await supabase
        .from('giveaways')
        .select(
          'id, recorded_at, recipient_name, recipient_phone, products_given, total_items, engagement_quality, follow_up_required, agent_id',
        )
        .eq('workspace_id', currentWorkspaceId!)
        .eq('is_deleted', false)
        .order('recorded_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      const agentIds = [
        ...new Set((data ?? []).map((g) => g.agent_id).filter((id): id is string => !!id)),
      ];
      if (agentIds.length > 0) {
        const { data: members } = await supabase
          .from('user_workspaces')
          .select('user_id, name, email')
          .eq('workspace_id', currentWorkspaceId!)
          .in('user_id', agentIds);
        const map: Record<string, string> = {};
        (members ?? []).forEach((m) => {
          if (!m.user_id) return;
          map[m.user_id] = m.name || m.email?.split('@')[0] || 'Agent';
        });
        setNameByAgent(map);
      }

      return data ?? [];
    },
    enabled: !!currentWorkspaceId,
  });

  const agentName = (g: Giveaway) =>
    g.agent_id ? nameByAgent[g.agent_id] || 'Agent' : 'Agent';

  return (
    <ComponentGate code="CRM-0130">
      <Screen scroll showBack>
        <SectionHeader title="Giveaways" />
        <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
          {giveaways.length} recorded
        </AppText>

        {isLoading ? (
          <LoadingSpinner label="Loading giveaways" />
        ) : giveaways.length === 0 ? (
          <EmptyMessage>No giveaways recorded.</EmptyMessage>
        ) : (
          giveaways.map((g) => (
            <Pressable key={g.id} onPress={() => setSelected(g)} hitSlop={hitSlop}>
              <ListItemCard
                title={g.recipient_name || 'Anonymous'}
                subtitle={[
                  `${g.total_items} items`,
                  agentName(g),
                  format(new Date(g.recorded_at), 'MMM d, h:mm a'),
                ].join(' • ')}
                trailing={
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    {g.follow_up_required ? <Badge variant="warning">Follow-up</Badge> : null}
                    {g.engagement_quality ? (
                      <Badge variant="secondary">{g.engagement_quality}</Badge>
                    ) : null}
                  </View>
                }
              />
            </Pressable>
          ))
        )}

        <Modal
          visible={!!selected}
          transparent
          animationType="slide"
          onRequestClose={() => setSelected(null)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <Pressable style={{ flex: 1 }} onPress={() => setSelected(null)} />
            <View
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: spacing.md,
                gap: spacing.sm,
              }}
            >
              <AppText style={{ fontWeight: '700', fontSize: 18 }}>
                {selected?.recipient_name || 'Anonymous'}
              </AppText>
              <AppText variant="secondary">
                Agent: {selected ? agentName(selected) : '—'}
              </AppText>
              {selected?.recipient_phone ? (
                <AppText variant="secondary">Phone: {selected.recipient_phone}</AppText>
              ) : null}
              <AppText variant="secondary">
                Products: {productsLabel(selected?.products_given)}
              </AppText>
              <Pressable onPress={() => setSelected(null)} hitSlop={hitSlop}>
                <AppText style={{ color: colors.primary, fontWeight: '600', marginTop: spacing.md }}>
                  Close
                </AppText>
              </Pressable>
            </View>
          </View>
        </Modal>
      </Screen>
    </ComponentGate>
  );
}
