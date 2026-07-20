// [CRM-0130] Supervisor Giveaways — workspace giveaways with date filter + detail modal
import { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertCircle, Clock, Gift, Phone, X } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { DateRangeChips } from '@/components/supervisor/DateRangeChips';
import {
  AppText,
  Badge,
  Card,
  EmptyMessage,
  LoadingSpinner,
  Screen,
} from '@/components/ui';
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { colors, hitSlop, radius, spacing } from '@/theme';

interface Giveaway {
  id: string;
  recorded_at: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  products_given: unknown;
  total_items: number;
  engagement_quality: string | null;
  follow_up_required: boolean | null;
}

function qualityVariant(
  quality: string | null,
): 'success' | 'warning' | 'destructive' | 'secondary' {
  switch (quality?.toLowerCase()) {
    case 'high':
      return 'success';
    case 'medium':
      return 'warning';
    case 'low':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export default function GiveawaysScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const { preset, setPreset, startISO, endISO } = useDateRangeFilter('today');
  const [selected, setSelected] = useState<Giveaway | null>(null);

  const { data: giveaways = [], isLoading } = useQuery({
    queryKey: ['supervisor-giveaways', currentWorkspaceId, startISO, endISO],
    enabled: Boolean(currentWorkspaceId),
    queryFn: async (): Promise<Giveaway[]> => {
      if (!currentWorkspaceId) return [];

      let query = supabase
        .from('giveaways')
        .select(
          'id, recorded_at, recipient_name, recipient_phone, products_given, total_items, engagement_quality, follow_up_required',
        )
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_deleted', false)
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (startISO) query = query.gte('recorded_at', startISO);
      if (endISO) query = query.lte('recorded_at', endISO);

      const { data, error } = await query;
      if (error) throw error;
      return (data as Giveaway[]) || [];
    },
  });

  const renderItem = useCallback(
    ({ item }: { item: Giveaway }) => (
      <Pressable onPress={() => setSelected(item)} hitSlop={hitSlop}>
        <Card style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.flex}>
              <AppText style={styles.title}>{item.recipient_name || 'Anonymous'}</AppText>
              {item.recipient_phone ? (
                <View style={styles.metaRow}>
                  <Phone size={14} color={colors.mutedForeground} />
                  <AppText variant="secondary">{item.recipient_phone}</AppText>
                </View>
              ) : null}
            </View>
            <View style={styles.badges}>
              {item.follow_up_required ? (
                <Badge variant="warning">Follow-up</Badge>
              ) : null}
              {item.engagement_quality ? (
                <Badge variant={qualityVariant(item.engagement_quality)}>
                  {item.engagement_quality}
                </Badge>
              ) : null}
            </View>
          </View>
          <View style={styles.metaRow}>
            <Gift size={16} color={colors.mutedForeground} />
            <AppText variant="secondary">{item.total_items} items</AppText>
            <Clock size={16} color={colors.mutedForeground} />
            <AppText variant="secondary">
              {format(new Date(item.recorded_at), 'MMM d, HH:mm')}
            </AppText>
          </View>
        </Card>
      </Pressable>
    ),
    [],
  );

  return (
    <ComponentGate code="CRM-0130">
      <Screen showBack style={styles.screen}>
        <View style={styles.header}>
          <Gift size={20} color={colors.primary} />
          <AppText style={styles.headerTitle}>Giveaways</AppText>
          <Badge variant="secondary">{String(giveaways.length)}</Badge>
        </View>
        <DateRangeChips preset={preset} onChange={setPreset} />

        {isLoading ? (
          <LoadingSpinner label="Loading giveaways" />
        ) : (
          <FlatList
            data={giveaways}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyMessage>No giveaways recorded.</EmptyMessage>}
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
                <AppText variant="h3">{selected?.recipient_name || 'Anonymous'}</AppText>
                <Pressable onPress={() => setSelected(null)} hitSlop={hitSlop}>
                  <X size={22} color={colors.mutedForeground} />
                </Pressable>
              </View>
              {selected ? (
                <View style={styles.sheetBody}>
                  <View style={styles.statGrid}>
                    <View style={styles.stat}>
                      <AppText variant="h2">{selected.total_items}</AppText>
                      <AppText variant="secondary">Items</AppText>
                    </View>
                    <View style={styles.stat}>
                      <AppText variant="h2" style={{ textTransform: 'capitalize' }}>
                        {selected.engagement_quality || '—'}
                      </AppText>
                      <AppText variant="secondary">Quality</AppText>
                    </View>
                  </View>
                  {selected.recipient_phone ? (
                    <View style={styles.metaRow}>
                      <Phone size={16} color={colors.mutedForeground} />
                      <AppText>{selected.recipient_phone}</AppText>
                    </View>
                  ) : null}
                  <View style={styles.metaRow}>
                    <Clock size={16} color={colors.mutedForeground} />
                    <AppText>
                      {format(new Date(selected.recorded_at), 'MMM d, yyyy · HH:mm')}
                    </AppText>
                  </View>
                  {selected.follow_up_required ? (
                    <View style={styles.metaRow}>
                      <AlertCircle size={16} color={colors.warning} />
                      <AppText>Follow-up required</AppText>
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
  list: { paddingBottom: spacing.xl, flexGrow: 1 },
  card: { marginBottom: spacing.sm },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  flex: { flex: 1 },
  title: { fontWeight: '500' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'flex-end' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
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
    minHeight: '45%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetBody: { gap: spacing.md },
  statGrid: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
});
