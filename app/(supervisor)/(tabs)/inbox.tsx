import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { format } from 'date-fns';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { uploadCheckInPhoto } from '@/utils/agentPhotos';
import {
  AppText,
  Badge,
  Button,
  Card,
  EmptyMessage,
  Input,
  ListItemCard,
  LoadingSpinner,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { appAlert } from '@/components/ui/AppAlert';
import { colors, hitSlop, radius, spacing } from '@/theme';
import { NOTIFICATION_TYPES } from '@/constants/notifications';
import { markNotificationsRead } from '@/hooks/useUnreadNotifications';

type Ticket = {
  id: string;
  agent_name: string;
  agent_email: string;
  ticket_type: string;
  inventory_issue_type: string | null;
  message: string;
  image_url: string | null;
  status: string;
  created_at: string;
};

type SentMessage = {
  id: string;
  recipient_id: string;
  recipient_name: string | null;
  message: string;
  image_url: string | null;
  location_label: string | null;
  created_at: string;
  is_read: boolean;
};

type WorkspaceMember = {
  user_id: string;
  name: string | null;
  email: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  bug_support: 'Bug Support',
  inventory_request: 'Inventory',
  missing_stats: 'Missing Stats',
};

function memberLabel(m: WorkspaceMember): string {
  return m.name || m.email?.split('@')[0] || 'User';
}

export default function InboxScreen() {
  const { currentWorkspaceId, currentProjectId } = useWorkspace();
  const { user } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const [loadingSent, setLoadingSent] = useState(true);

  const [showCompose, setShowCompose] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<WorkspaceMember | null>(null);
  const [composeMessage, setComposeMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [attachUri, setAttachUri] = useState<string | null>(null);
  const [attachLocation, setAttachLocation] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!currentWorkspaceId) return;
    const { data } = await supabase
      .from('user_workspaces')
      .select('user_id, name, email')
      .eq('workspace_id', currentWorkspaceId)
      .eq('is_deleted', false)
      .eq('is_active', true);
    setMembers((data as WorkspaceMember[]) || []);
  }, [currentWorkspaceId]);

  const fetchTickets = useCallback(async () => {
    if (!currentWorkspaceId) return;
    setLoading(true);
    let query = supabase
      .from('support_tickets')
      .select('*')
      .eq('workspace_id', currentWorkspaceId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(100);
    if (currentProjectId) query = query.eq('project_id', currentProjectId);
    const { data } = await query;
    setTickets((data as Ticket[]) || []);
    setLoading(false);
  }, [currentWorkspaceId, currentProjectId]);

  const fetchSentMessages = useCallback(async () => {
    if (!user || !currentWorkspaceId) return;
    setLoadingSent(true);
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
        id: msg.id,
        recipient_id: msg.recipient_id,
        recipient_name: member?.name || member?.email || null,
        message: msg.message,
        image_url: msg.image_url,
        location_label: msg.location_label,
        created_at: msg.created_at,
        is_read: !!msg.is_read,
      };
    });
    setSentMessages(enriched);
    setLoadingSent(false);
  }, [user, currentWorkspaceId, members]);

  useEffect(() => {
    void fetchTickets();
    void fetchMembers();
  }, [fetchTickets, fetchMembers]);

  useEffect(() => {
    if (!user?.id) return;
    void markNotificationsRead({
      userId: user.id,
      types: [
        NOTIFICATION_TYPES.newMessage,
        NOTIFICATION_TYPES.noShow,
        NOTIFICATION_TYPES.flaggedReport,
        NOTIFICATION_TYPES.dailyDigest,
      ],
      workspaceId: currentWorkspaceId,
    });
  }, [user?.id, currentWorkspaceId]);

  useEffect(() => {
    if (members.length > 0) void fetchSentMessages();
  }, [members, fetchSentMessages]);

  const filteredTickets = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.toLowerCase();
    return tickets.filter(
      (t) =>
        t.agent_name?.toLowerCase().includes(q) ||
        t.message?.toLowerCase().includes(q) ||
        TYPE_LABELS[t.ticket_type]?.toLowerCase().includes(q),
    );
  }, [tickets, search]);

  const filteredMembers = useMemo(() => {
    const base = members.filter((m) => m.user_id !== user?.id);
    if (!recipientSearch.trim()) return base;
    const q = recipientSearch.toLowerCase();
    return base.filter(
      (m) => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q),
    );
  }, [members, recipientSearch, user?.id]);

  const updateStatus = async (ticketId: string, newStatus: string) => {
    await supabase.from('support_tickets').update({ status: newStatus }).eq('id', ticketId);
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)),
    );
    setSelectedTicket((prev) => (prev?.id === ticketId ? { ...prev, status: newStatus } : prev));
  };

  const handleDeleteTicket = async (ticketId: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ is_deleted: true })
      .eq('id', ticketId);
    if (error) {
      appAlert('Failed', error.message);
      return;
    }
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setSelectedTicket(null);
  };

  const handleDeleteSent = async (messageId: string) => {
    const { error } = await supabase
      .from('supervisor_messages')
      .update({ is_deleted: true })
      .eq('id', messageId);
    if (error) {
      appAlert('Failed', error.message);
      return;
    }
    setSentMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setAttachUri(result.assets[0].uri);
  };

  const attachCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      appAlert('Location needed', 'Allow location to attach your position.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    setAttachLocation({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      label: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
    });
  };

  const handleSend = async () => {
    if (!selectedRecipient || !composeMessage.trim() || !user || !currentWorkspaceId) return;
    setSending(true);
    try {
      let imageUrl: string | null = null;
      if (attachUri) {
        imageUrl = await uploadCheckInPhoto(attachUri, user.id);
      }
      const senderName = user.user_metadata?.display_name || user.email || 'Supervisor';
      const { error } = await supabase.from('supervisor_messages').insert({
        sender_id: user.id,
        sender_name: senderName,
        recipient_id: selectedRecipient.user_id,
        message: composeMessage.trim(),
        workspace_id: currentWorkspaceId,
        image_url: imageUrl,
        location_lat: attachLocation?.lat ?? null,
        location_lng: attachLocation?.lng ?? null,
        location_label: attachLocation?.label ?? null,
      });
      if (error) throw error;
      appAlert('Message sent', `Sent to ${memberLabel(selectedRecipient)}`);
      setComposeMessage('');
      setSelectedRecipient(null);
      setRecipientOpen(false);
      setRecipientSearch('');
      setAttachUri(null);
      setAttachLocation(null);
      setShowCompose(false);
      await fetchSentMessages();
    } catch (err) {
      appAlert('Failed to send', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSending(false);
    }
  };

  const closeCompose = () => {
    setShowCompose(false);
    setRecipientOpen(false);
    setRecipientSearch('');
  };

  return (
    <ComponentGate code="CRM-0126">
      <Screen scroll scrollProps={{ keyboardShouldPersistTaps: 'handled' }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          <Button
            size="sm"
            variant={showCompose ? 'outline' : 'primary'}
            onPress={() => {
              if (showCompose) closeCompose();
              else setShowCompose(true);
            }}
            style={{ flex: 1 }}
          >
            {showCompose ? 'Hide compose' : 'Compose'}
          </Button>
        </View>

        {showCompose ? (
          <Card style={{ marginBottom: spacing.md, overflow: 'visible', zIndex: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing.md,
              }}
            >
              <AppText style={{ fontWeight: '700', fontSize: 18 }}>Compose message</AppText>
              <Pressable onPress={closeCompose} hitSlop={hitSlop} accessibilityLabel="Close compose">
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <AppText
              variant="secondary"
              style={{ fontSize: 12, fontWeight: '600', marginBottom: spacing.xs }}
            >
              To
            </AppText>

            {selectedRecipient ? (
              <View
                style={{
                  minHeight: 48,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingHorizontal: spacing.md,
                  marginBottom: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.muted,
                }}
              >
                <AppText style={{ flex: 1, fontWeight: '500' }}>
                  {memberLabel(selectedRecipient)}
                </AppText>
                <Pressable
                  onPress={() => {
                    setSelectedRecipient(null);
                    setRecipientOpen(false);
                    setRecipientSearch('');
                  }}
                  hitSlop={hitSlop}
                  accessibilityLabel="Clear recipient"
                >
                  <Ionicons name="close" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ) : (
              <View style={{ marginBottom: spacing.md }}>
                <Pressable
                  onPress={() => setRecipientOpen((open) => !open)}
                  hitSlop={hitSlop}
                  style={{
                    minHeight: 48,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: spacing.md,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  }}
                >
                  <AppText variant="secondary">Select agent...</AppText>
                  <Ionicons
                    name={recipientOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>

                {recipientOpen ? (
                  <View
                    style={{
                      marginTop: spacing.sm,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      padding: spacing.sm,
                    }}
                  >
                    <Input
                      placeholder="Search agents..."
                      value={recipientSearch}
                      onChangeText={setRecipientSearch}
                      autoFocus
                      containerStyle={{ marginBottom: spacing.sm }}
                    />
                    <ScrollView
                      style={{ maxHeight: 180 }}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled
                    >
                      {filteredMembers.length === 0 ? (
                        <AppText
                          variant="secondary"
                          style={{
                            textAlign: 'center',
                            paddingVertical: spacing.md,
                            fontSize: 13,
                          }}
                        >
                          No agents found
                        </AppText>
                      ) : (
                        filteredMembers.map((m) => (
                          <Pressable
                            key={m.user_id}
                            onPress={() => {
                              setSelectedRecipient(m);
                              setRecipientOpen(false);
                              setRecipientSearch('');
                            }}
                            hitSlop={hitSlop}
                            style={{
                              minHeight: 44,
                              paddingHorizontal: spacing.sm,
                              paddingVertical: spacing.sm,
                              borderRadius: radius.sm,
                              justifyContent: 'center',
                            }}
                          >
                            <AppText style={{ fontWeight: '600' }}>{memberLabel(m)}</AppText>
                            {m.email ? (
                              <AppText variant="secondary" style={{ fontSize: 12 }}>
                                {m.email}
                              </AppText>
                            ) : null}
                          </Pressable>
                        ))
                      )}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
            )}

            <Input
              placeholder="Message"
              value={composeMessage}
              onChangeText={setComposeMessage}
              multiline
              style={{ minHeight: 88, textAlignVertical: 'top' }}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
              <Button
                size="sm"
                variant="outline"
                onPress={() => void pickImage()}
                style={{ flex: 1 }}
              >
                {attachUri ? 'Photo attached' : 'Attach photo'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onPress={() => void attachCurrentLocation()}
                style={{ flex: 1 }}
              >
                {attachLocation ? 'Location on' : 'Add location'}
              </Button>
            </View>
            <Button
              loading={sending}
              disabled={!selectedRecipient || !composeMessage.trim()}
              onPress={() => void handleSend()}
            >
              Send
            </Button>
          </Card>
        ) : null}

        <Input
          placeholder="Search tickets by agent, type, or content..."
          value={search}
          onChangeText={setSearch}
        />

        <SectionHeader title="Support tickets" />
        {loading ? (
          <LoadingSpinner label="Loading tickets" />
        ) : filteredTickets.length === 0 ? (
          <EmptyMessage>No tickets.</EmptyMessage>
        ) : (
          filteredTickets.map((t) => (
            <Pressable key={t.id} onPress={() => setSelectedTicket(t)} hitSlop={hitSlop}>
              <ListItemCard
                title={t.agent_name || 'Agent'}
                subtitle={[
                  TYPE_LABELS[t.ticket_type] || t.ticket_type,
                  t.message.slice(0, 60),
                  format(new Date(t.created_at), 'MMM d'),
                ].join(' • ')}
                trailing={<Badge variant="secondary">{t.status}</Badge>}
              />
            </Pressable>
          ))
        )}

        <SectionHeader title="Sent messages" />
        {loadingSent ? (
          <LoadingSpinner label="Loading sent" />
        ) : sentMessages.length === 0 ? (
          <EmptyMessage>No sent messages.</EmptyMessage>
        ) : (
          sentMessages.map((m) => (
            <ListItemCard
              key={m.id}
              title={m.recipient_name || 'Recipient'}
              subtitle={[m.message.slice(0, 60), format(new Date(m.created_at), 'MMM d')].join(
                ' • ',
              )}
              trailing={
                <Pressable onPress={() => void handleDeleteSent(m.id)} hitSlop={hitSlop}>
                  <AppText style={{ color: colors.destructive, fontWeight: '600' }}>Delete</AppText>
                </Pressable>
              }
            />
          ))
        )}

        {/* Ticket detail */}
        <Modal
          visible={!!selectedTicket}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedTicket(null)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <Pressable style={{ flex: 1 }} onPress={() => setSelectedTicket(null)} />
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
                {selectedTicket?.agent_name}
              </AppText>
              <AppText variant="secondary">{selectedTicket?.agent_email}</AppText>
              <Badge variant="secondary">
                {TYPE_LABELS[selectedTicket?.ticket_type || ''] || selectedTicket?.ticket_type || ''}
              </Badge>
              <AppText>{selectedTicket?.message}</AppText>
              {selectedTicket?.image_url ? (
                <Image
                  source={{ uri: selectedTicket.image_url }}
                  style={{ width: '100%', height: 180, borderRadius: 12 }}
                />
              ) : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={selectedTicket?.status === status ? 'primary' : 'outline'}
                    onPress={() => selectedTicket && void updateStatus(selectedTicket.id, status)}
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
              </View>
              <Button
                variant="destructive"
                onPress={() => selectedTicket && void handleDeleteTicket(selectedTicket.id)}
              >
                Delete ticket
              </Button>
            </View>
          </View>
        </Modal>
      </Screen>
    </ComponentGate>
  );
}
