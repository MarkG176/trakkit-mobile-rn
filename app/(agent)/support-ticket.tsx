import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Linking, Pressable, View } from 'react-native';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { workspaceService } from '@/services/workspaceService';
import { FormField } from '@/components/forms/FormField';
import {
  Screen,
  Button,
  Card,
  Badge,
  AppText,
  SectionHeader,
  LoadingSpinner,
  EmptyMessage,
} from '@/components/ui';
import { colors, spacing } from '@/theme';

type TicketType = 'bug_support' | 'inventory_request' | 'missing_stats';
type InventoryIssueType = 'missing_inventory' | 'incorrect_inventory_details';

interface MyTicket {
  id: string;
  ticket_type: string;
  message: string;
  status: string;
  created_at: string;
}

interface SupervisorMessage {
  id: string;
  sender_name: string | null;
  message: string;
  created_at: string;
  image_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_label: string | null;
}

const TICKET_OPTIONS: {
  type: TicketType;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  iconColor: string;
}[] = [
  {
    type: 'bug_support',
    label: 'Bug Support',
    description: 'Report app bugs or technical issues',
    icon: 'bug',
    accent: '#FFE5E3',
    iconColor: colors.destructive,
  },
  {
    type: 'inventory_request',
    label: 'Inventory Request',
    description: 'Report missing or incorrect inventory',
    icon: 'cube',
    accent: '#FFF4D6',
    iconColor: colors.warning,
  },
  {
    type: 'missing_stats',
    label: 'Missing Stats',
    description: 'Report missing or inaccurate statistics',
    icon: 'bar-chart',
    accent: colors.primaryLight,
    iconColor: colors.primary,
  },
];

const TYPE_LABELS: Record<string, string> = {
  bug_support: 'Bug Support',
  inventory_request: 'Inventory',
  missing_stats: 'Missing Stats',
};

function statusBadgeVariant(status: string): 'success' | 'warning' | 'secondary' {
  if (status === 'open') return 'success';
  if (status === 'in_progress') return 'warning';
  return 'secondary';
}

export default function SupportTicketScreen() {
  const { user } = useAuth();
  const { currentWorkspaceId, currentProjectId } = useWorkspace();
  const [selectedType, setSelectedType] = useState<TicketType | null>(null);
  const [inventoryIssueType, setInventoryIssueType] = useState<InventoryIssueType | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myTickets, setMyTickets] = useState<MyTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [supervisorMessages, setSupervisorMessages] = useState<SupervisorMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const fetchMyTickets = useCallback(async () => {
    if (!user) return;
    setLoadingTickets(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('id, ticket_type, message, status, created_at')
      .eq('agent_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    setMyTickets(data ?? []);
    setLoadingTickets(false);
  }, [user]);

  const fetchSupervisorMessages = useCallback(async () => {
    if (!user) return;
    setLoadingMessages(true);
    const { data } = await supabase
      .from('supervisor_messages')
      .select(
        'id, sender_name, message, created_at, image_url, location_lat, location_lng, location_label, is_read',
      )
      .eq('recipient_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    setSupervisorMessages(
      (data ?? []).map((row) => ({
        id: row.id,
        sender_name: row.sender_name,
        message: row.message,
        created_at: row.created_at,
        image_url: row.image_url,
        location_lat: row.location_lat,
        location_lng: row.location_lng,
        location_label: row.location_label,
      })),
    );
    setLoadingMessages(false);

    const unread = (data ?? []).filter((row) => !row.is_read).map((row) => row.id);
    if (unread.length > 0) {
      await supabase.from('supervisor_messages').update({ is_read: true }).in('id', unread);
    }
  }, [user]);

  useEffect(() => {
    fetchMyTickets();
    fetchSupervisorMessages();
  }, [fetchMyTickets, fetchSupervisorMessages]);

  const canSubmit = () => {
    if (!selectedType || !message.trim()) return false;
    if (selectedType === 'inventory_request' && !inventoryIssueType) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !user) return;

    setSubmitting(true);
    try {
      const payload = workspaceService.ensureWorkspaceContext({
        agent_id: user.id,
        agent_email: user.email ?? null,
        project_id: currentProjectId,
        ticket_type: selectedType!,
        inventory_issue_type: selectedType === 'inventory_request' ? inventoryIssueType : null,
        message: message.trim(),
        status: 'open',
      });

      const { error } = await supabase.from('support_tickets').insert(payload);
      if (error) throw error;

      setSubmitted(true);
      setMessage('');
      setSelectedType(null);
      setInventoryIssueType(null);
      await fetchMyTickets();
    } catch (error) {
      Alert.alert('Failed to submit', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    const { error } = await supabase.from('support_tickets').update({ is_deleted: true }).eq('id', ticketId);
    if (error) {
      Alert.alert('Failed to delete', error.message);
      return;
    }
    setMyTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('supervisor_messages')
      .update({ is_deleted: true })
      .eq('id', messageId);
    if (error) {
      Alert.alert('Failed to delete', error.message);
      return;
    }
    setSupervisorMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const openLocation = (lat: number, lng: number) => {
    Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
  };

  if (submitted) {
    return (
      <Screen scroll title="Ticket Submitted" showBack subtitle="Our team will follow up soon">
        <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <AppText variant="h3" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
            Thank you!
          </AppText>
          <AppText variant="secondary" style={{ textAlign: 'center', marginBottom: spacing.lg }}>
            Our team is already working on your request.
          </AppText>
          <Button onPress={() => setSubmitted(false)} style={{ alignSelf: 'stretch' }}>
            Back to Chat
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll title="Chat" showBack subtitle="Choose the type of issue you're experiencing">
      {loadingMessages ? (
        <LoadingSpinner label="Loading messages" />
      ) : supervisorMessages.length > 0 ? (
        <Card style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <Ionicons name="chatbubbles" size={20} color={colors.primary} />
            <AppText style={{ fontWeight: '600', marginLeft: spacing.sm, flex: 1 }}>Messages</AppText>
            <Badge variant="secondary">{String(supervisorMessages.length)}</Badge>
          </View>
          {supervisorMessages.map((msg) => (
            <View
              key={msg.id}
              style={{
                backgroundColor: colors.muted,
                borderRadius: 8,
                padding: spacing.md,
                marginBottom: spacing.sm,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <AppText style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
                  {msg.sender_name || 'Supervisor'}
                </AppText>
                <Pressable onPress={() => handleDeleteMessage(msg.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color={colors.secondaryForeground} />
                </Pressable>
              </View>
              <AppText style={{ fontSize: 14 }}>{msg.message}</AppText>
              {msg.image_url ? (
                <Image
                  source={{ uri: msg.image_url }}
                  style={{ marginTop: spacing.sm, width: '100%', height: 160, borderRadius: 8 }}
                  resizeMode="cover"
                />
              ) : null}
              {msg.location_lat != null && msg.location_lng != null ? (
                <Pressable
                  onPress={() => openLocation(msg.location_lat!, msg.location_lng!)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm }}
                >
                  <Ionicons name="location-outline" size={14} color={colors.primary} />
                  <AppText style={{ fontSize: 12, color: colors.primary }}>
                    {msg.location_label || 'View location'}
                  </AppText>
                </Pressable>
              ) : null}
              <AppText variant="secondary" style={{ fontSize: 11, marginTop: 4 }}>
                {format(new Date(msg.created_at), 'MMM d, HH:mm')}
              </AppText>
            </View>
          ))}
        </Card>
      ) : null}

      <SectionHeader title="Report an issue" />

      {TICKET_OPTIONS.map((option) => {
        const selected = selectedType === option.type;
        return (
          <Pressable
            key={option.type}
            onPress={() => {
              setSelectedType(option.type);
              setInventoryIssueType(null);
            }}
            style={{ marginBottom: spacing.sm }}
          >
            <Card
              style={{
                borderColor: selected ? colors.primary : colors.border,
                borderWidth: selected ? 2 : 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: selected ? option.accent : colors.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={option.icon} size={20} color={selected ? option.iconColor : colors.secondaryForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontWeight: '600', fontSize: 14 }}>{option.label}</AppText>
                  <AppText variant="secondary" style={{ fontSize: 12, marginTop: 2 }}>
                    {option.description}
                  </AppText>
                </View>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryForeground }} /> : null}
                </View>
              </View>
            </Card>
          </Pressable>
        );
      })}

      {selectedType === 'inventory_request' ? (
        <View style={{ marginBottom: spacing.md }}>
          <AppText style={{ fontWeight: '500', marginBottom: spacing.sm }}>What&apos;s the issue?</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {(
              [
                { value: 'missing_inventory' as InventoryIssueType, label: 'Missing Inventory' },
                { value: 'incorrect_inventory_details' as InventoryIssueType, label: 'Incorrect Details' },
              ] as const
            ).map((opt) => (
              <Button
                key={opt.value}
                variant={inventoryIssueType === opt.value ? 'primary' : 'outline'}
                size="sm"
                style={{ flex: 1 }}
                onPress={() => setInventoryIssueType(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </View>
        </View>
      ) : null}

      {selectedType ? (
        <>
          <FormField
            label="Describe the issue *"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            placeholder="Please provide as much detail as possible..."
            style={{ minHeight: 120, textAlignVertical: 'top' }}
          />
          <Button onPress={handleSubmit} loading={submitting} disabled={!canSubmit()}>
            Submit ticket
          </Button>
        </>
      ) : null}

      <Card style={{ marginTop: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <Ionicons name="file-tray-full-outline" size={20} color={colors.primary} />
          <AppText style={{ fontWeight: '600', marginLeft: spacing.sm, flex: 1 }}>My Requests</AppText>
          <Badge variant="secondary">{String(myTickets.length)}</Badge>
        </View>
        {loadingTickets ? (
          <LoadingSpinner label="Loading tickets" />
        ) : myTickets.length === 0 ? (
          <EmptyMessage>No requests yet</EmptyMessage>
        ) : (
          myTickets.map((ticket) => (
            <View
              key={ticket.id}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                backgroundColor: colors.muted,
                borderRadius: 8,
                padding: spacing.md,
                marginBottom: spacing.sm,
              }}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 }}>
                  <AppText style={{ fontSize: 12, fontWeight: '600' }}>
                    {TYPE_LABELS[ticket.ticket_type] ?? ticket.ticket_type}
                  </AppText>
                  <Badge variant={statusBadgeVariant(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </View>
                <AppText variant="secondary" style={{ fontSize: 12 }} numberOfLines={2}>
                  {ticket.message}
                </AppText>
                <AppText variant="secondary" style={{ fontSize: 11, marginTop: 4 }}>
                  {format(new Date(ticket.created_at), 'MMM d, HH:mm')}
                </AppText>
              </View>
              <Pressable onPress={() => handleDeleteTicket(ticket.id)} hitSlop={8} style={{ padding: 4 }}>
                <Ionicons name="trash-outline" size={18} color={colors.secondaryForeground} />
              </Pressable>
            </View>
          ))
        )}
      </Card>

      {!currentWorkspaceId ? (
        <AppText variant="secondary" style={{ marginTop: spacing.md, textAlign: 'center' }}>
          Select a workspace to submit tickets.
        </AppText>
      ) : null}
    </Screen>
  );
}

