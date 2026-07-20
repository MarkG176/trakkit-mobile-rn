// [CRM-0126] Supervisor Inbox — support tickets + supervisor messages compose
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import {
  Bug,
  BarChart3,
  Inbox,
  MapPin,
  MessageSquare,
  Package,
  Plus,
  Send,
  X,
} from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import {
  AppText,
  Badge,
  Button,
  Card,
  EmptyMessage,
  Input,
  LoadingSpinner,
  Screen,
} from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { colors, hitSlop, radius, spacing } from '@/theme';

type TabKey = 'tickets' | 'sent';

interface Ticket {
  id: string;
  agent_name: string | null;
  agent_email: string | null;
  ticket_type: string;
  inventory_issue_type: string | null;
  message: string;
  image_url: string | null;
  status: string;
  created_at: string;
}

interface SentMessage {
  id: string;
  recipient_id: string;
  recipient_name: string | null;
  message: string;
  image_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_label: string | null;
  created_at: string;
  is_read: boolean;
}

interface WorkspaceMember {
  user_id: string;
  name: string | null;
  email: string | null;
}

const TYPE_META: Record<
  string,
  { label: string; icon: typeof Bug; variant: 'destructive' | 'warning' | 'primary' }
> = {
  bug_support: { label: 'Bug Support', icon: Bug, variant: 'destructive' },
  inventory_request: { label: 'Inventory', icon: Package, variant: 'warning' },
  missing_stats: { label: 'Missing Stats', icon: BarChart3, variant: 'primary' },
};

function statusVariant(status: string): 'success' | 'warning' | 'secondary' {
  if (status === 'open') return 'success';
  if (status === 'in_progress') return 'warning';
  return 'secondary';
}

function memberLabel(m: WorkspaceMember): string {
  return m.name || m.email?.split('@')[0] || 'Unknown';
}

export default function InboxScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentWorkspaceId, currentProjectId } = useWorkspace();
  const [tab, setTab] = useState<TabKey>('tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sent, setSent] = useState<SentMessage[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [showCompose, setShowCompose] = useState(false);
  const [recipient, setRecipient] = useState<WorkspaceMember | null>(null);
  const [composeMessage, setComposeMessage] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [sending, setSending] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!currentWorkspaceId) return;
    const { data } = await supabase
      .from('user_workspaces')
      .select('user_id, name, email')
      .eq('workspace_id', currentWorkspaceId)
      .eq('is_deleted', false)
      .eq('is_active', true);
    setMembers(
      ((data || []) as WorkspaceMember[]).filter((m) => Boolean(m.user_id)),
    );
  }, [currentWorkspaceId]);

  const fetchTickets = useCallback(async () => {
    if (!currentWorkspaceId) return;
    setLoading(true);
    let query = supabase
      .from('support_tickets')
      .select(
        'id, agent_name, agent_email, ticket_type, inventory_issue_type, message, image_url, status, created_at',
      )
      .eq('workspace_id', currentWorkspaceId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (currentProjectId) query = query.eq('project_id', currentProjectId);

    const { data } = await query;
    setTickets((data as Ticket[]) || []);
    setLoading(false);
  }, [currentWorkspaceId, currentProjectId]);

  const fetchSent = useCallback(async () => {
    if (!user || !currentWorkspaceId) return;
    const { data } = await supabase
      .from('supervisor_messages')
      .select(
        'id, recipient_id, message, created_at, is_read, image_url, location_lat, location_lng, location_label',
      )
      .eq('sender_id', user.id)
      .eq('workspace_id', currentWorkspaceId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    const enriched: SentMessage[] = (data || []).map((msg) => {
      const member = members.find((m) => m.user_id === msg.recipient_id);
      return {
        ...msg,
        recipient_name: member?.name || member?.email || null,
      };
    });
    setSent(enriched);
  }, [user, currentWorkspaceId, members]);

  useEffect(() => {
    fetchTickets();
    fetchMembers();
  }, [fetchTickets, fetchMembers]);

  useEffect(() => {
    if (members.length >= 0) fetchSent();
  }, [members, fetchSent]);

  const filteredMembers = useMemo(() => {
    const list = members.filter((m) => m.user_id !== user?.id);
    const q = recipientSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q),
    );
  }, [members, recipientSearch, user?.id]);

  const openMap = (lat: number, lng: number, agentId?: string) => {
    router.push({
      pathname: '/(supervisor)/map',
      params: {
        lat: String(lat),
        lng: String(lng),
        ...(agentId ? { agentId } : {}),
      },
    });
  };

  const updateTicketStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status })
      .eq('id', id);
    if (error) {
      Alert.alert('Update failed', error.message);
      return;
    }
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    setSelectedTicket((prev) => (prev?.id === id ? { ...prev, status } : prev));
  };

  const handleSend = async () => {
    if (!user || !currentWorkspaceId || !recipient || !composeMessage.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from('supervisor_messages').insert({
        sender_id: user.id,
        sender_name:
          (user.user_metadata?.display_name as string | undefined) ||
          user.email ||
          'Supervisor',
        recipient_id: recipient.user_id,
        message: composeMessage.trim(),
        workspace_id: currentWorkspaceId,
      });
      if (error) throw error;
      setComposeMessage('');
      setRecipient(null);
      setShowCompose(false);
      await fetchSent();
      setTab('sent');
    } catch (err) {
      Alert.alert('Send failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setSending(false);
    }
  };

  const renderTicket = ({ item }: { item: Ticket }) => {
    const meta = TYPE_META[item.ticket_type] || TYPE_META.bug_support;
    const Icon = meta.icon;
    return (
      <Pressable onPress={() => setSelectedTicket(item)} hitSlop={hitSlop}>
        <Card style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.typeRow}>
              <Icon size={18} color={colors.primary} />
              <AppText style={styles.title} numberOfLines={1}>
                {item.agent_name || item.agent_email || 'Agent'}
              </AppText>
            </View>
            <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
          </View>
          <AppText variant="secondary" numberOfLines={2}>
            {item.message}
          </AppText>
          <View style={styles.metaRow}>
            <Badge variant="outline">{meta.label}</Badge>
            <AppText variant="secondary" style={styles.dateText}>
              {format(new Date(item.created_at), 'MMM d, HH:mm')}
            </AppText>
          </View>
        </Card>
      </Pressable>
    );
  };

  const renderSent = ({ item }: { item: SentMessage }) => (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <AppText style={styles.title} numberOfLines={1}>
          To: {item.recipient_name || 'Agent'}
        </AppText>
        <Badge variant={item.is_read ? 'secondary' : 'success'}>
          {item.is_read ? 'Read' : 'Unread'}
        </Badge>
      </View>
      <AppText variant="secondary" numberOfLines={3}>
        {item.message}
      </AppText>
      <View style={styles.metaRow}>
        <AppText variant="secondary" style={styles.dateText}>
          {format(new Date(item.created_at), 'MMM d, HH:mm')}
        </AppText>
        {item.location_lat != null && item.location_lng != null ? (
          <Pressable
            onPress={() =>
              openMap(item.location_lat!, item.location_lng!, item.recipient_id)
            }
            hitSlop={hitSlop}
            style={styles.locationBtn}
          >
            <MapPin size={16} color={colors.primary} />
            <AppText style={styles.locationText}>
              {item.location_label || 'View on map'}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );

  return (
    <ComponentGate code="CRM-0126">
      <Screen style={styles.screen}>
        <View style={styles.header}>
          <Inbox size={20} color={colors.primary} />
          <AppText style={styles.headerTitle}>Inbox</AppText>
          <Pressable
            onPress={() => setShowCompose(true)}
            hitSlop={hitSlop}
            style={styles.composeBtn}
          >
            <Plus size={20} color={colors.primaryForeground} />
          </Pressable>
        </View>

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setTab('tickets')}
            style={[styles.tab, tab === 'tickets' && styles.tabActive]}
            hitSlop={hitSlop}
          >
            <MessageSquare
              size={16}
              color={tab === 'tickets' ? colors.primary : colors.mutedForeground}
            />
            <AppText
              style={[styles.tabLabel, tab === 'tickets' && styles.tabLabelActive]}
            >
              Tickets ({tickets.length})
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => setTab('sent')}
            style={[styles.tab, tab === 'sent' && styles.tabActive]}
            hitSlop={hitSlop}
          >
            <Send
              size={16}
              color={tab === 'sent' ? colors.primary : colors.mutedForeground}
            />
            <AppText style={[styles.tabLabel, tab === 'sent' && styles.tabLabelActive]}>
              Sent ({sent.length})
            </AppText>
          </Pressable>
        </View>

        {loading && tab === 'tickets' ? (
          <LoadingSpinner label="Loading inbox" />
        ) : tab === 'tickets' ? (
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id}
            renderItem={renderTicket}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyMessage>No support tickets.</EmptyMessage>}
          />
        ) : (
          <FlatList
            data={sent}
            keyExtractor={(item) => item.id}
            renderItem={renderSent}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyMessage>No sent messages.</EmptyMessage>}
          />
        )}

        {/* Ticket detail */}
        <Modal
          visible={!!selectedTicket}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedTicket(null)}
        >
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <AppText variant="h3">
                  {selectedTicket?.agent_name || 'Ticket'}
                </AppText>
                <Pressable onPress={() => setSelectedTicket(null)} hitSlop={hitSlop}>
                  <X size={22} color={colors.mutedForeground} />
                </Pressable>
              </View>
              {selectedTicket ? (
                <View style={styles.sheetBody}>
                  {selectedTicket.agent_email ? (
                    <AppText variant="secondary">{selectedTicket.agent_email}</AppText>
                  ) : null}
                  <AppText>{selectedTicket.message}</AppText>
                  {selectedTicket.inventory_issue_type ? (
                    <Badge variant="warning">{selectedTicket.inventory_issue_type}</Badge>
                  ) : null}
                  <AppText variant="secondary">
                    {format(new Date(selectedTicket.created_at), 'MMM d, yyyy · HH:mm')}
                  </AppText>
                  <View style={styles.statusActions}>
                    {(['open', 'in_progress', 'resolved', 'closed'] as const).map(
                      (status) => (
                        <Pressable
                          key={status}
                          onPress={() => updateTicketStatus(selectedTicket.id, status)}
                          hitSlop={hitSlop}
                          style={[
                            styles.statusChip,
                            selectedTicket.status === status && styles.statusChipActive,
                          ]}
                        >
                          <AppText
                            style={[
                              styles.statusChipText,
                              selectedTicket.status === status &&
                                styles.statusChipTextActive,
                            ]}
                          >
                            {status.replace(/_/g, ' ')}
                          </AppText>
                        </Pressable>
                      ),
                    )}
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </Modal>

        {/* Compose */}
        <Modal
          visible={showCompose}
          animationType="slide"
          transparent
          onRequestClose={() => setShowCompose(false)}
        >
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <AppText variant="h3">New message</AppText>
                <Pressable onPress={() => setShowCompose(false)} hitSlop={hitSlop}>
                  <X size={22} color={colors.mutedForeground} />
                </Pressable>
              </View>
              <Input
                label="Recipient"
                placeholder="Search agents..."
                value={recipient ? memberLabel(recipient) : recipientSearch}
                onChangeText={(text) => {
                  setRecipient(null);
                  setRecipientSearch(text);
                }}
              />
              {!recipient ? (
                <FlatList
                  data={filteredMembers.slice(0, 8)}
                  keyExtractor={(item) => item.user_id}
                  style={styles.recipientList}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        setRecipient(item);
                        setRecipientSearch('');
                      }}
                      hitSlop={hitSlop}
                      style={styles.recipientRow}
                    >
                      <AppText>{memberLabel(item)}</AppText>
                      {item.email ? (
                        <AppText variant="secondary">{item.email}</AppText>
                      ) : null}
                    </Pressable>
                  )}
                />
              ) : null}
              <Input
                label="Message"
                placeholder="Write a message..."
                value={composeMessage}
                onChangeText={setComposeMessage}
                multiline
                numberOfLines={4}
                style={styles.messageInput}
              />
              <Button
                onPress={handleSend}
                disabled={!recipient || !composeMessage.trim() || sending}
              >
                {sending ? 'Sending…' : 'Send'}
              </Button>
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
  composeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    paddingHorizontal: spacing.sm,
  },
  tabActive: { backgroundColor: colors.primaryLight },
  tabLabel: { fontSize: 14, color: colors.mutedForeground, fontWeight: '500' },
  tabLabelActive: { color: colors.primary },
  list: { paddingBottom: spacing.xl, flexGrow: 1 },
  card: { marginBottom: spacing.sm, gap: spacing.xs },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  title: { fontWeight: '500', flex: 1 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dateText: { fontSize: 12 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  locationText: { color: colors.primary, fontWeight: '500', fontSize: 14 },
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
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetBody: { gap: spacing.md },
  statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusChip: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    justifyContent: 'center',
  },
  statusChipActive: { backgroundColor: colors.primary },
  statusChipText: {
    fontSize: 14,
    textTransform: 'capitalize',
    color: colors.foreground,
    fontWeight: '500',
  },
  statusChipTextActive: { color: colors.primaryForeground },
  recipientList: { maxHeight: 160, marginBottom: spacing.sm },
  recipientRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  messageInput: { minHeight: 100, textAlignVertical: 'top' },
});
