import { useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import {
  AppText,
  EmptyMessage,
  Input,
  ListItemCard,
  LoadingSpinner,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { colors, hitSlop, spacing } from '@/theme';

type FeedbackItem = {
  id: string;
  customer_name: string | null;
  contact_phone: string | null;
  content: string;
  agent_id: string | null;
  created_at: string;
  note_type: string | null;
};

export default function FeedbackScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [nameByAgent, setNameByAgent] = useState<Record<string, string>>({});

  const { data: feedbackItems = [], isLoading } = useQuery({
    queryKey: ['mobile-feedback', currentWorkspaceId],
    queryFn: async (): Promise<FeedbackItem[]> => {
      const { data, error } = await supabase
        .from('notes')
        .select('id, customer_name, contact_phone, content, agent_id, created_at, note_type')
        .eq('workspace_id', currentWorkspaceId!)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      const agentIds = [
        ...new Set((data ?? []).map((n) => n.agent_id).filter((id): id is string => !!id)),
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

      return (data ?? []).map((row) => ({
        ...row,
        created_at: row.created_at || new Date().toISOString(),
      }));
    },
    enabled: !!currentWorkspaceId,
  });

  const filtered = useMemo(
    () =>
      feedbackItems.filter(
        (item) =>
          item.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.agent_id &&
            nameByAgent[item.agent_id]?.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    [feedbackItems, searchQuery, nameByAgent],
  );

  const agentName = (item: FeedbackItem) =>
    item.agent_id ? nameByAgent[item.agent_id] || 'Agent' : 'Agent';

  return (
    <ComponentGate code="CRM-0119">
      <Screen scroll showBack>
        <SectionHeader title="Customer feedback" />
        <Input
          placeholder="Search feedback..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
          {filtered.length} notes
        </AppText>

        {isLoading ? (
          <LoadingSpinner label="Loading feedback" />
        ) : filtered.length === 0 ? (
          <EmptyMessage>No feedback found.</EmptyMessage>
        ) : (
          filtered.map((item) => (
            <Pressable key={item.id} onPress={() => setSelected(item)} hitSlop={hitSlop}>
              <ListItemCard
                title={item.customer_name || 'Anonymous'}
                subtitle={[
                  item.content.slice(0, 80),
                  agentName(item),
                  format(new Date(item.created_at), 'MMM d'),
                ].join(' • ')}
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
                {selected?.customer_name || 'Anonymous'}
              </AppText>
              <AppText variant="secondary">
                Agent: {selected ? agentName(selected) : '—'}
              </AppText>
              {selected?.contact_phone ? (
                <AppText variant="secondary">Phone: {selected.contact_phone}</AppText>
              ) : null}
              <AppText style={{ marginTop: spacing.sm }}>{selected?.content}</AppText>
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
