import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { formatCurrencySimple } from '@/utils/currency';
import { isInStoreWorkLocation, workspaceService } from '@/services/workspaceService';
import { AssignInventoryDialog } from '@/components/supervisor/AssignInventoryDialog';
import { UserDetailSheet } from '@/components/supervisor/UserDetailSheet';
import { useWorkspaceUsersForTeams } from '@/hooks/useTeams';
import {
  AppText,
  Badge,
  Button,
  EmptyMessage,
  IconButton,
  Input,
  ListItemCard,
  LoadingSpinner,
  Screen,
} from '@/components/ui';
import { appAlert } from '@/components/ui/AppAlert';
import { colors, hitSlop, radius, spacing } from '@/theme';

type Member = {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
};

type InventoryRow = {
  name: string;
  quantity: number;
  product_variant_id: string;
};

function memberLabel(m: Pick<Member, 'name' | 'email'>): string {
  return m.name || m.email?.split('@')[0] || 'Unknown';
}

export default function UsersScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const { user } = useAuth();
  const currency = workspaceService.getProjectCurrencyCode();
  const { data: usersWithTeams = [] } = useWorkspaceUsersForTeams(currentWorkspaceId);
  const teamByUserId = useMemo(() => {
    const map = new Map<string, string>();
    usersWithTeams.forEach((u) => {
      if (u.current_team_name) map.set(u.user_id, u.current_team_name);
    });
    return map;
  }, [usersWithTeams]);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [inviteRole, setInviteRole] = useState<'agent' | 'supervisor'>('agent');
  const [inviteLoading, setInviteLoading] = useState(false);

  const [contactOpen, setContactOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingContact, setSendingContact] = useState(false);

  const [memberSales, setMemberSales] = useState<{ units: number; value: number } | null>(null);
  const [memberInventory, setMemberInventory] = useState<InventoryRow[]>([]);
  const [hideInventoryCounts, setHideInventoryCounts] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!currentWorkspaceId) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_workspaces')
      .select('id, user_id, role, is_active, name, email')
      .eq('workspace_id', currentWorkspaceId)
      .eq('is_deleted', false);
    setMembers(
      (data ?? [])
        .filter((m): m is typeof m & { user_id: string } => !!m.user_id)
        .map((m) => ({
          id: m.id,
          user_id: m.user_id,
          name: m.name,
          email: m.email,
          role: m.role,
          is_active: m.is_active ?? true,
        })),
    );
    setLoading(false);
  }, [currentWorkspaceId]);

  const fetchMemberInventory = useCallback(
    async (agentId: string) => {
      if (!currentWorkspaceId) return;
      setInventoryLoading(true);
      try {
        const [{ data: agentWorkspaceRow }, { data: inventoryData }] = await Promise.all([
          supabase
            .from('user_workspaces')
            .select('active_components')
            .eq('user_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .eq('is_deleted', false)
            .maybeSingle(),
          supabase
            .from('agent_task_inventory')
            .select('amount_issued, product_variant_id, product_variants!inner(name)')
            .eq('agent_id', agentId)
            .eq('is_deleted', false)
            .eq('product_variants.workspace_id', currentWorkspaceId),
        ]);

        const activeComponents = agentWorkspaceRow?.active_components;
        setHideInventoryCounts(
          isInStoreWorkLocation(
            activeComponents && typeof activeComponents === 'object' && !Array.isArray(activeComponents)
              ? (activeComponents as Record<string, boolean | string>)
              : null,
          ),
        );

        const inventoryByVariant = new Map<string, InventoryRow>();
        (inventoryData ?? []).forEach((row) => {
          const variantRaw = row.product_variants;
          const variant = Array.isArray(variantRaw) ? variantRaw[0] : variantRaw;
          const name =
            variant && typeof variant === 'object' && 'name' in variant
              ? String((variant as { name: string | null }).name || 'Unknown')
              : 'Unknown';
          const existing = inventoryByVariant.get(row.product_variant_id);
          if (existing) {
            existing.quantity += Number(row.amount_issued || 0);
          } else {
            inventoryByVariant.set(row.product_variant_id, {
              product_variant_id: row.product_variant_id,
              name,
              quantity: Number(row.amount_issued || 0),
            });
          }
        });
        setMemberInventory(Array.from(inventoryByVariant.values()));
      } finally {
        setInventoryLoading(false);
      }
    },
    [currentWorkspaceId],
  );

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (!currentWorkspaceId) return;
    const channel = supabase
      .channel(`supervisor-users-${currentWorkspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_workspaces',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        () => {
          void fetchMembers();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId, fetchMembers]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q),
    );
  }, [members, searchQuery]);

  const openMember = async (m: Member) => {
    setSelectedMember(m);
    setShowDetail(false);
    setMemberInventory([]);
    setHideInventoryCounts(false);
    const { data: salesData } = await supabase
      .from('daily_sales_tracking')
      .select('quantity_sold, total_value')
      .eq('agent_id', m.user_id)
      .eq('workspace_id', currentWorkspaceId!);
    setMemberSales({
      units: salesData?.reduce((sum, s) => sum + (s.quantity_sold || 0), 0) || 0,
      value: salesData?.reduce((sum, s) => sum + (s.total_value || 0), 0) || 0,
    });
    await fetchMemberInventory(m.user_id);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !currentWorkspaceId) {
      appAlert('Email required', 'Enter an email address to invite.');
      return;
    }
    setInviteLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('create-user', {
        body: {
          email: inviteEmail.trim(),
          displayName: inviteDisplayName.trim() || undefined,
          role: inviteRole,
          workspaceId: currentWorkspaceId,
        },
      });
      if (fnError) throw fnError;
      if (fnData?.error) throw new Error(fnData.error);
      appAlert('User invited', `${inviteEmail.trim()} was added to the workspace.`);
      setInviteOpen(false);
      setInviteEmail('');
      setInviteDisplayName('');
      setInviteRole('agent');
      await fetchMembers();
    } catch (err) {
      appAlert('Invite failed', err instanceof Error ? err.message : 'Could not invite user.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSendContact = async () => {
    if (!selectedMember || !contactMessage.trim() || !user || !currentWorkspaceId) return;
    setSendingContact(true);
    try {
      const senderName =
        user.user_metadata?.display_name || user.email || 'Supervisor';
      const { error } = await supabase.from('supervisor_messages').insert({
        sender_id: user.id,
        sender_name: senderName,
        recipient_id: selectedMember.user_id,
        message: contactMessage.trim(),
        workspace_id: currentWorkspaceId,
      });
      if (error) throw error;
      appAlert('Sent', `Message sent to ${memberLabel(selectedMember)}.`);
      setContactOpen(false);
      setContactMessage('');
    } catch (err) {
      appAlert('Failed', err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setSendingContact(false);
    }
  };

  const handleCallAgent = async () => {
    if (!selectedMember) return;
    const { data, error } = await supabase
      .from('user_roles')
      .select('phone_number')
      .eq('user_id', selectedMember.user_id)
      .maybeSingle();
    if (error) {
      Alert.alert('Unable to call', error.message);
      return;
    }
    const phone = data?.phone_number?.trim().replace(/\s+/g, '') ?? '';
    if (!phone) {
      Alert.alert('No phone number', 'This agent has no phone number linked.');
      return;
    }
    const url = `tel:${phone}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Unable to call', 'Calling is not supported on this device.');
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <ComponentGate code="CRM-0123">
      <Screen scroll>
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            marginBottom: spacing.md,
            flexWrap: 'wrap',
          }}
        >
          <Button
            size="sm"
            onPress={() => setInviteOpen(true)}
            style={{ flexGrow: 1 }}
          >
            Invite user
          </Button>
          <Button
            size="sm"
            variant="outline"
            onPress={() => router.push('/(supervisor)/teams' as never)}
            style={{ flexGrow: 1 }}
          >
            Manage teams
          </Button>
        </View>

        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {loading ? (
          <LoadingSpinner label="Loading users" />
        ) : filtered.length === 0 ? (
          <EmptyMessage>No users found.</EmptyMessage>
        ) : (
          filtered.map((m) => (
            <Pressable key={m.id} onPress={() => void openMember(m)} hitSlop={hitSlop}>
              <ListItemCard
                title={memberLabel(m)}
                subtitle={[
                  m.email,
                  m.role,
                  teamByUserId.get(m.user_id) ?? 'No team',
                  m.is_active ? 'Active' : 'Inactive',
                ]
                  .filter(Boolean)
                  .join(' • ')}
                trailing={!m.is_active ? <Badge variant="warning">Inactive</Badge> : undefined}
              />
            </Pressable>
          ))
        )}

        {/* Invite modal */}
        <Modal visible={inviteOpen} transparent animationType="slide" onRequestClose={() => setInviteOpen(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <Pressable style={{ flex: 1 }} onPress={() => setInviteOpen(false)} />
            <View
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: spacing.md,
              }}
            >
              <AppText style={{ fontWeight: '700', fontSize: 18, marginBottom: spacing.md }}>
                Invite user
              </AppText>
              <Input
                label="Email"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Input
                label="Display name"
                value={inviteDisplayName}
                onChangeText={setInviteDisplayName}
              />
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
                <Button
                  size="sm"
                  variant={inviteRole === 'agent' ? 'primary' : 'outline'}
                  onPress={() => setInviteRole('agent')}
                  style={{ flex: 1 }}
                >
                  Agent
                </Button>
                <Button
                  size="sm"
                  variant={inviteRole === 'supervisor' ? 'primary' : 'outline'}
                  onPress={() => setInviteRole('supervisor')}
                  style={{ flex: 1 }}
                >
                  Supervisor
                </Button>
              </View>
              <Button loading={inviteLoading} onPress={() => void handleInvite()}>
                Send invite
              </Button>
            </View>
          </View>
        </Modal>

        {/* Member quick sheet */}
        <Modal
          visible={!!selectedMember && !showDetail && !assignOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedMember(null)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <Pressable style={{ flex: 1 }} onPress={() => setSelectedMember(null)} />
            <View
              style={{
                maxHeight: '80%',
                backgroundColor: colors.background,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: spacing.md,
                gap: spacing.sm,
              }}
            >
              <AppText style={{ fontWeight: '700', fontSize: 18 }}>
                {selectedMember ? memberLabel(selectedMember) : ''}
              </AppText>
              <AppText variant="secondary">{selectedMember?.email}</AppText>
              <AppText variant="secondary">
                Team:{' '}
                {selectedMember
                  ? teamByUserId.get(selectedMember.user_id) ?? 'No team assigned'
                  : '—'}
              </AppText>
              {memberSales ? (
                <AppText variant="secondary">
                  Sales: {memberSales.units} units •{' '}
                  {formatCurrencySimple(memberSales.value, currency)}
                </AppText>
              ) : null}

              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  padding: spacing.sm,
                  gap: spacing.sm,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing.sm,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 }}>
                    <Ionicons name="cube-outline" size={16} color={colors.foreground} />
                    <AppText style={{ fontWeight: '600', fontSize: 14 }}>Current Inventory</AppText>
                  </View>
                  <Button size="sm" variant="outline" onPress={() => setAssignOpen(true)}>
                    Assign
                  </Button>
                </View>
                {inventoryLoading ? (
                  <LoadingSpinner label="Loading inventory" />
                ) : memberInventory.length > 0 ? (
                  <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                    {memberInventory.map((item) => (
                      <View
                        key={item.product_variant_id}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          gap: spacing.sm,
                          paddingVertical: 4,
                        }}
                      >
                        <AppText style={{ flex: 1, fontSize: 14 }}>{item.name}</AppText>
                        {!hideInventoryCounts ? (
                          <AppText style={{ fontSize: 14, fontWeight: '600' }}>
                            {item.quantity} units
                          </AppText>
                        ) : null}
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <AppText variant="secondary" style={{ fontSize: 14 }}>
                    No inventory assigned
                  </AppText>
                )}
              </View>

              <Button
                onPress={() => {
                  setShowDetail(true);
                }}
              >
                View today&apos;s activity
              </Button>
              <Button
                variant="outline"
                onPress={() => {
                  setSelectedMember(null);
                  router.push('/(supervisor)/teams' as never);
                }}
              >
                Manage team assignment
              </Button>
              <Button variant="outline" onPress={() => setContactOpen(true)}>
                Contact
              </Button>
              <Pressable onPress={() => setSelectedMember(null)} hitSlop={hitSlop}>
                <AppText style={{ color: colors.primary, fontWeight: '600', textAlign: 'center' }}>
                  Close
                </AppText>
              </Pressable>
            </View>
          </View>
        </Modal>

        {selectedMember && showDetail ? (
          <UserDetailSheet
            open={showDetail}
            onClose={() => {
              setShowDetail(false);
              setSelectedMember(null);
            }}
            userId={selectedMember.user_id}
            displayName={memberLabel(selectedMember)}
          />
        ) : null}

        {selectedMember && currentWorkspaceId ? (
          <AssignInventoryDialog
            open={assignOpen}
            onClose={() => setAssignOpen(false)}
            agentId={selectedMember.user_id}
            agentLabel={memberLabel(selectedMember)}
            workspaceId={currentWorkspaceId}
            onAssigned={() => void fetchMemberInventory(selectedMember.user_id)}
          />
        ) : null}

        <Modal
          visible={contactOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setContactOpen(false)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <Pressable style={{ flex: 1 }} onPress={() => setContactOpen(false)} />
            <View
              style={{
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
                  gap: spacing.sm,
                }}
              >
                <AppText style={{ fontWeight: '700', fontSize: 18, flex: 1 }}>
                  Message {selectedMember ? memberLabel(selectedMember) : ''}
                </AppText>
                <IconButton onPress={() => void handleCallAgent()} accessibilityLabel="Call agent">
                  <Ionicons name="call-outline" size={20} color={colors.primary} />
                </IconButton>
              </View>
              <Input
                placeholder="Write a message..."
                value={contactMessage}
                onChangeText={setContactMessage}
                multiline
                style={{ minHeight: 96, textAlignVertical: 'top' }}
              />
              <Button loading={sendingContact} onPress={() => void handleSendContact()}>
                Send
              </Button>
            </View>
          </View>
        </Modal>
      </Screen>
    </ComponentGate>
  );
}
