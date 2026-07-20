// [CRM-0119] Supervisor Feedback — interaction outcomes with date filter
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Clock, MessageSquare, Search, User, X } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { DateRangeChips } from '@/components/supervisor/DateRangeChips';
import {
  AppText,
  Badge,
  Card,
  EmptyMessage,
  Input,
  LoadingSpinner,
  Screen,
} from '@/components/ui';
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { colors, hitSlop, radius, spacing } from '@/theme';

interface FeedbackItem {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  outcome: string | null;
  interaction_type: string | null;
  agent_id: string | null;
  created_at: string | null;
}

export default function FeedbackScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const { preset, setPreset, startISO, endISO } = useDateRangeFilter('today');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FeedbackItem | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['supervisor-feedback', currentWorkspaceId, startISO, endISO],
    enabled: Boolean(currentWorkspaceId),
    queryFn: async (): Promise<FeedbackItem[]> => {
      if (!currentWorkspaceId) return [];

      let query = supabase
        .from('interactions')
        .select(
          'id, customer_name, customer_phone, outcome, interaction_type, agent_id, created_at',
        )
        .eq('workspace_id', currentWorkspaceId)
        .not('outcome', 'is', null)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(100);

      if (startISO) query = query.gte('created_at', startISO);
      if (endISO) query = query.lte('created_at', endISO);

      const { data, error } = await query;
      if (error) throw error;
      return (data as FeedbackItem[]) || [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.customer_name?.toLowerCase().includes(q) ||
        item.outcome?.toLowerCase().includes(q) ||
        item.interaction_type?.toLowerCase().includes(q),
    );
  }, [items, search]);

  const renderItem = useCallback(
    ({ item }: { item: FeedbackItem }) => (
      <Pressable onPress={() => setSelected(item)} hitSlop={hitSlop}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <MessageSquare size={20} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <View style={styles.cardTop}>
                <AppText style={styles.title} numberOfLines={1}>
                  {item.customer_name || 'Anonymous'}
                </AppText>
                {item.created_at ? (
                  <AppText variant="secondary" style={styles.dateLabel}>
                    {format(new Date(item.created_at), 'MMM d')}
                  </AppText>
                ) : null}
              </View>
              <AppText variant="secondary" numberOfLines={2}>
                {item.outcome}
              </AppText>
              {item.interaction_type ? (
                <Badge variant="outline" style={styles.typeBadge}>
                  {item.interaction_type}
                </Badge>
              ) : null}
            </View>
          </View>
        </Card>
      </Pressable>
    ),
    [],
  );

  return (
    <ComponentGate code="CRM-0119">
      <Screen showBack style={styles.screen}>
        <View style={styles.header}>
          <MessageSquare size={20} color={colors.primary} />
          <AppText style={styles.headerTitle}>Feedback</AppText>
          <Badge variant="secondary">{String(filtered.length)}</Badge>
        </View>
        <DateRangeChips preset={preset} onChange={setPreset} />
        <View style={styles.searchWrap}>
          <Search size={18} color={colors.mutedForeground} style={styles.searchIcon} />
          <Input
            placeholder="Search feedback..."
            value={search}
            onChangeText={setSearch}
            containerStyle={styles.searchInput}
            style={styles.searchField}
          />
        </View>

        {isLoading ? (
          <LoadingSpinner label="Loading feedback" />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyMessage>No feedback found.</EmptyMessage>}
          />
        )}

        <Modal
          visible={!!selected}
          animationType="slide"
          transparent
          onRequestClose={() => setSelected(null)}
        >
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <AppText variant="h3">{selected?.customer_name || 'Anonymous'}</AppText>
                <Pressable onPress={() => setSelected(null)} hitSlop={hitSlop}>
                  <X size={22} color={colors.mutedForeground} />
                </Pressable>
              </View>
              {selected ? (
                <View style={styles.sheetBody}>
                  <AppText>{selected.outcome}</AppText>
                  {selected.customer_phone ? (
                    <AppText variant="secondary">{selected.customer_phone}</AppText>
                  ) : null}
                  {selected.interaction_type ? (
                    <Badge variant="outline">{selected.interaction_type}</Badge>
                  ) : null}
                  {selected.created_at ? (
                    <View style={styles.metaRow}>
                      <Clock size={16} color={colors.mutedForeground} />
                      <AppText variant="secondary">
                        {format(new Date(selected.created_at), 'MMM d, yyyy · HH:mm')}
                      </AppText>
                    </View>
                  ) : null}
                  {selected.agent_id ? (
                    <View style={styles.metaRow}>
                      <User size={16} color={colors.mutedForeground} />
                      <AppText variant="secondary" numberOfLines={1}>
                        Agent {selected.agent_id.slice(0, 8)}…
                      </AppText>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        </Modal>
      </Screen>
    </ComponentGate>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerTitle: { flex: 1, fontWeight: '600', fontSize: 16 },
  searchWrap: { position: 'relative' },
  searchIcon: { position: 'absolute', left: spacing.md, top: 18, zIndex: 1 },
  searchInput: { marginBottom: spacing.sm },
  searchField: { paddingLeft: 40 },
  list: { paddingBottom: spacing.xl, flexGrow: 1 },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: { fontWeight: '500', flex: 1 },
  dateLabel: { fontSize: 12 },
  typeBadge: { alignSelf: 'flex-start', marginTop: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    minHeight: '40%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetBody: { gap: spacing.md },
});
