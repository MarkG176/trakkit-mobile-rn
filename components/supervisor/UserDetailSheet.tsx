import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { formatCurrencySimple } from '@/utils/currency';
import { workspaceService } from '@/services/workspaceService';
import {
  AppText,
  Button,
  Card,
  EmptyMessage,
  LoadingSpinner,
} from '@/components/ui';
import { CheckInThumbnail } from '@/components/shared/CatalogCards';
import { colors, hitSlop, spacing } from '@/theme';
import { appAlert } from '@/components/ui/AppAlert';

type UserDetailSheetProps = {
  open: boolean;
  onClose: () => void;
  userId: string;
  displayName: string | null;
};

type CheckIn = {
  id: string;
  status: string;
  timestamp: string;
  location_lat: number | null;
  location_lng: number | null;
  selfie_url: string | null;
};

type Sale = {
  id: string;
  quantity_sold: number;
  sale_value: number | null;
  created_at: string;
  product_name: string | null;
};

type Giveaway = {
  id: string;
  recipient_name: string | null;
  total_items: number;
  recorded_at: string;
};

type Interaction = {
  id: string;
  interaction_type: string | null;
  customer_name: string | null;
  timestamp: string | null;
  outcome: string | null;
};

type Note = {
  id: string;
  content: string;
  customer_name: string | null;
  created_at: string | null;
};

type AssignedStore = { store_id: string; store_name: string };
type StoreOption = { id: string; store_name: string };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <AppText
        variant="secondary"
        style={{
          fontSize: 12,
          fontWeight: '700',
          textTransform: 'uppercase',
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </AppText>
      {children}
    </View>
  );
}

export function UserDetailSheet({ open, onClose, userId, displayName }: UserDetailSheetProps) {
  const { currentWorkspaceId } = useWorkspace();
  const { height } = useWindowDimensions();
  const currency = workspaceService.getProjectCurrencyCode();
  const today = new Date().toISOString().split('T')[0];

  const [loading, setLoading] = useState(true);
  const [lastCheckIn, setLastCheckIn] = useState<CheckIn | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [assignedStore, setAssignedStore] = useState<AssignedStore | null>(null);
  const [allStores, setAllStores] = useState<StoreOption[]>([]);
  const [assigningStore, setAssigningStore] = useState(false);
  const [showStorePicker, setShowStorePicker] = useState(false);

  const name = displayName || 'Agent';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    if (!open || !userId || !currentWorkspaceId) return;

    const load = async () => {
      setLoading(true);
      const [
        checkInResult,
        salesResult,
        storeResult,
        giveawayResult,
        interactionResult,
        notesResult,
        storesResult,
      ] = await Promise.all([
        supabase
          .from('agent_status_log')
          .select('id, status, timestamp, location_lat, location_lng, selfie_url')
          .eq('agent_id', userId)
          .eq('workspace_id', currentWorkspaceId)
          .order('timestamp', { ascending: false })
          .limit(1),
        supabase
          .from('daily_sales_tracking')
          .select('id, quantity_sold, total_value, created_at, product_name')
          .eq('agent_id', userId)
          .eq('workspace_id', currentWorkspaceId)
          .eq('work_date', today)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('agent_status_log')
          .select('store_id, stores:store_id(store_name)')
          .eq('agent_id', userId)
          .eq('workspace_id', currentWorkspaceId)
          .eq('status', 'set_location')
          .not('store_id', 'is', null)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('giveaways')
          .select('id, recipient_name, total_items, recorded_at')
          .eq('agent_id', userId)
          .eq('workspace_id', currentWorkspaceId)
          .gte('recorded_at', `${today}T00:00:00`)
          .lte('recorded_at', `${today}T23:59:59`)
          .order('recorded_at', { ascending: false })
          .limit(10),
        supabase
          .from('interactions')
          .select('id, interaction_type, customer_name, timestamp, outcome')
          .eq('agent_id', userId)
          .eq('workspace_id', currentWorkspaceId)
          .gte('timestamp', `${today}T00:00:00`)
          .lte('timestamp', `${today}T23:59:59`)
          .order('timestamp', { ascending: false })
          .limit(10),
        supabase
          .from('notes')
          .select('id, content, customer_name, created_at')
          .eq('agent_id', userId)
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('stores')
          .select('id, store_name')
          .eq('workspace_id', currentWorkspaceId)
          .eq('is_deleted', false)
          .order('store_name'),
      ]);

      setLastCheckIn(checkInResult.data?.[0] ?? null);
      setRecentSales(
        (salesResult.data ?? []).map((s) => ({
          id: s.id,
          quantity_sold: s.quantity_sold,
          sale_value: s.total_value,
          created_at: s.created_at || '',
          product_name: s.product_name || 'Product',
        })),
      );
      setGiveaways(giveawayResult.data ?? []);
      setInteractions(interactionResult.data ?? []);
      setNotes(notesResult.data ?? []);
      setAllStores(storesResult.data ?? []);

      const storeRow = storeResult.data as
        | { store_id: string; stores: { store_name: string } | null }
        | null;
      if (storeRow?.store_id) {
        setAssignedStore({
          store_id: storeRow.store_id,
          store_name: storeRow.stores?.store_name || 'Unknown Store',
        });
      } else {
        setAssignedStore(null);
      }
      setLoading(false);
    };

    void load();
  }, [open, userId, currentWorkspaceId, today]);

  const handleAssignStore = async (storeId: string) => {
    if (!currentWorkspaceId) return;
    setAssigningStore(true);
    try {
      const { error } = await supabase.from('agent_status_log').insert({
        agent_id: userId,
        workspace_id: currentWorkspaceId,
        status: 'set_location',
        store_id: storeId,
        timestamp: new Date().toISOString(),
        agent_display_name: displayName,
      });
      if (error) throw error;
      const store = allStores.find((s) => s.id === storeId);
      setAssignedStore({ store_id: storeId, store_name: store?.store_name || 'Store' });
      setShowStorePicker(false);
      appAlert('Store assigned', 'Location updated for this agent.');
    } catch {
      appAlert('Failed', 'Could not assign store.');
    } finally {
      setAssigningStore(false);
    }
  };

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            maxHeight: height * 0.85,
            backgroundColor: colors.background,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: spacing.md,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
              <CheckInThumbnail uri={lastCheckIn?.selfie_url} size={48} />
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '700', fontSize: 18 }} numberOfLines={1}>
                  {name}
                </AppText>
                {lastCheckIn ? (
                  <AppText variant="secondary" style={{ fontSize: 13, textTransform: 'capitalize' }}>
                    {lastCheckIn.status.replace(/_/g, ' ')} •{' '}
                    {format(new Date(lastCheckIn.timestamp), 'h:mm a')}
                  </AppText>
                ) : (
                  <AppText variant="secondary" style={{ fontSize: 13 }}>
                    Initials {initials}
                  </AppText>
                )}
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={hitSlop}>
              <AppText style={{ color: colors.primary, fontWeight: '600' }}>Close</AppText>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {loading ? (
              <LoadingSpinner label="Loading agent details" />
            ) : (
              <>
                <Section title="Assigned store">
                  {assignedStore ? (
                    <Card>
                      <AppText style={{ fontWeight: '600' }}>{assignedStore.store_name}</AppText>
                    </Card>
                  ) : (
                    <EmptyMessage>No store assigned today.</EmptyMessage>
                  )}
                  <Button
                    variant="secondary"
                    onPress={() => setShowStorePicker((v) => !v)}
                    style={{ marginTop: spacing.sm }}
                  >
                    {showStorePicker ? 'Hide stores' : 'Assign store'}
                  </Button>
                  {showStorePicker
                    ? allStores.map((s) => (
                        <Pressable
                          key={s.id}
                          onPress={() => handleAssignStore(s.id)}
                          disabled={assigningStore}
                          hitSlop={hitSlop}
                          style={{
                            paddingVertical: spacing.sm,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                          }}
                        >
                          <AppText>{s.store_name}</AppText>
                        </Pressable>
                      ))
                    : null}
                </Section>

                <Section title="Today's sales">
                  {recentSales.length === 0 ? (
                    <EmptyMessage>No sales today.</EmptyMessage>
                  ) : (
                    recentSales.map((s) => (
                      <ListRow
                        key={s.id}
                        title={s.product_name || 'Product'}
                        subtitle={`qty ${s.quantity_sold}`}
                        trailing={formatCurrencySimple(s.sale_value ?? 0, currency)}
                      />
                    ))
                  )}
                </Section>

                <Section title="Today's giveaways">
                  {giveaways.length === 0 ? (
                    <EmptyMessage>No giveaways today.</EmptyMessage>
                  ) : (
                    giveaways.map((g) => (
                      <ListRow
                        key={g.id}
                        title={g.recipient_name || 'Recipient'}
                        subtitle={`${g.total_items} items`}
                        trailing={format(new Date(g.recorded_at), 'h:mm a')}
                      />
                    ))
                  )}
                </Section>

                <Section title="Interactions">
                  {interactions.length === 0 ? (
                    <EmptyMessage>No interactions today.</EmptyMessage>
                  ) : (
                    interactions.map((i) => (
                      <ListRow
                        key={i.id}
                        title={i.customer_name || i.interaction_type || 'Interaction'}
                        subtitle={i.outcome || undefined}
                      />
                    ))
                  )}
                </Section>

                <Section title="Notes">
                  {notes.length === 0 ? (
                    <EmptyMessage>No notes today.</EmptyMessage>
                  ) : (
                    notes.map((n) => (
                      <Card key={n.id} style={{ marginBottom: spacing.sm }}>
                        <AppText style={{ fontWeight: '600' }}>
                          {n.customer_name || 'Note'}
                        </AppText>
                        <AppText variant="secondary" style={{ marginTop: 4 }}>
                          {n.content}
                        </AppText>
                      </Card>
                    ))
                  )}
                </Section>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ListRow({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: string;
  trailing?: string;
}) {
  return (
    <Card style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <AppText style={{ fontWeight: '600' }}>{title}</AppText>
          {subtitle ? (
            <AppText variant="secondary" style={{ marginTop: 2, fontSize: 13 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {trailing ? (
          <AppText style={{ fontWeight: '600', color: colors.primary }}>{trailing}</AppText>
        ) : null}
      </View>
    </Card>
  );
}
