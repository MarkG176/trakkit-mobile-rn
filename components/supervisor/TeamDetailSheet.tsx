import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  TEAM_TYPE_OPTIONS,
  TeamType,
  WorkspaceTeam,
  teamTypeLabel,
  useTeamMembers,
  useTeamMutations,
  useWorkspaceUsersForTeams,
} from '@/hooks/useTeams';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import {
  AppText,
  Badge,
  Button,
  ChipSelect,
  EmptyMessage,
  Input,
  KeyboardAwareSheet,
  ListItemCard,
  LoadingSpinner,
} from '@/components/ui';
import { appAlert } from '@/components/ui/AppAlert';
import { colors, hitSlop, spacing } from '@/theme';

type TeamDetailSheetProps = {
  open: boolean;
  team: WorkspaceTeam | null;
  onClose: () => void;
};

export function TeamDetailSheet({ open, team, onClose }: TeamDetailSheetProps) {
  const { currentWorkspaceId } = useWorkspace();
  const { updateTeam, deleteTeam, addMember, removeMember } = useTeamMutations(currentWorkspaceId);
  const { data: members = [], isLoading: membersLoading } = useTeamMembers(
    open && team ? team.id : null,
    team?.team_lead_id ?? null,
  );
  const { data: workspaceUsers = [] } = useWorkspaceUsersForTeams(
    open ? currentWorkspaceId : null,
  );

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teamType, setTeamType] = useState<TeamType>('hybrid');
  const [addOpen, setAddOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!team || !open) return;
    setName(team.name);
    setDescription(team.description ?? '');
    setTeamType((team.team_type as TeamType) || 'hybrid');
    setEditing(false);
    setAddOpen(false);
    setMemberSearch('');
  }, [team, open]);

  const candidateUsers = useMemo(() => {
    if (!team) return [];
    const onTeam = new Set(members.map((m) => m.agent_id));
    const q = memberSearch.trim().toLowerCase();
    return workspaceUsers
      .filter((u) => !onTeam.has(u.user_id))
      .filter(
        (u) =>
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q),
      );
  }, [workspaceUsers, members, team, memberSearch]);

  if (!team) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      appAlert('Name required', 'Enter a team name.');
      return;
    }
    setSaving(true);
    try {
      await updateTeam.mutateAsync({
        teamId: team.id,
        patch: {
          name: name.trim(),
          description: description.trim() || null,
          team_type: teamType,
        },
      });
      setEditing(false);
    } catch (err) {
      appAlert('Update failed', err instanceof Error ? err.message : 'Could not update team.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetLead = async (agentId: string | null) => {
    try {
      await updateTeam.mutateAsync({
        teamId: team.id,
        patch: { team_lead_id: agentId },
      });
    } catch (err) {
      appAlert('Update failed', err instanceof Error ? err.message : 'Could not set team lead.');
    }
  };

  const handleToggleActive = async () => {
    try {
      await updateTeam.mutateAsync({
        teamId: team.id,
        patch: { is_active: !team.is_active },
      });
    } catch (err) {
      appAlert('Update failed', err instanceof Error ? err.message : 'Could not update team status.');
    }
  };

  const handleRemoveMember = (membershipId: string, agentId: string, memberName: string) => {
    Alert.alert('Remove member', `Remove ${memberName} from ${team.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await removeMember.mutateAsync({
                membershipId,
                teamId: team.id,
                agentId,
                clearLead: team.team_lead_id === agentId,
              });
            } catch (err) {
              appAlert(
                'Remove failed',
                err instanceof Error ? err.message : 'Could not remove member.',
              );
            }
          })();
        },
      },
    ]);
  };

  const handleAddMember = async (agentId: string, alreadyOnTeam: string | null) => {
    const confirmAdd = async () => {
      try {
        await addMember.mutateAsync({ teamId: team.id, agentId });
        setAddOpen(false);
        setMemberSearch('');
      } catch (err) {
        appAlert('Add failed', err instanceof Error ? err.message : 'Could not add member.');
      }
    };

    if (alreadyOnTeam) {
      Alert.alert(
        'Move to this team?',
        `This person is currently on ${alreadyOnTeam}. Assigning them will move them to ${team.name}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Move', onPress: () => void confirmAdd() },
        ],
      );
      return;
    }
    await confirmAdd();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete team',
      `Delete ${team.name}? Members will be removed from the team. This can be undone by an admin.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteTeam.mutateAsync(team.id);
                onClose();
              } catch (err) {
                appAlert(
                  'Delete failed',
                  err instanceof Error ? err.message : 'Could not delete team.',
                );
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <>
      <KeyboardAwareSheet visible={open && !addOpen} onClose={onClose}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          <View style={{ flex: 1, gap: spacing.xs }}>
            <AppText style={{ fontWeight: '700', fontSize: 18 }}>{team.name}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              <Badge variant="secondary">{teamTypeLabel(team.team_type)}</Badge>
              <Badge variant={team.is_active ? 'success' : 'warning'}>
                {team.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </View>
          </View>
          <Pressable onPress={onClose} hitSlop={hitSlop} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        {editing ? (
          <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
            <Input label="Team name" value={name} onChangeText={setName} />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              style={{ minHeight: 72, textAlignVertical: 'top' }}
            />
            <ChipSelect
              label="Team type"
              options={TEAM_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={teamType}
              onChange={(v) => setTeamType(v as TeamType)}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => {
                  setName(team.name);
                  setDescription(team.description ?? '');
                  setTeamType((team.team_type as TeamType) || 'hybrid');
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button style={{ flex: 1 }} loading={saving} onPress={() => void handleSave()}>
                Save
              </Button>
            </View>
          </View>
        ) : (
          <View style={{ marginBottom: spacing.md, gap: spacing.sm }}>
            {team.description ? (
              <AppText variant="secondary">{team.description}</AppText>
            ) : (
              <AppText variant="secondary">No description</AppText>
            )}
            <AppText variant="secondary" style={{ fontSize: 14 }}>
              Lead: {team.lead_name ?? 'Not assigned'}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <Button size="sm" variant="outline" onPress={() => setEditing(true)}>
                Edit details
              </Button>
              <Button size="sm" variant="outline" onPress={() => void handleToggleActive()}>
                {team.is_active ? 'Deactivate' : 'Activate'}
              </Button>
              <Button size="sm" variant="destructive" onPress={handleDelete}>
                Delete
              </Button>
            </View>
          </View>
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.sm,
            gap: spacing.sm,
          }}
        >
          <AppText style={{ fontWeight: '700', fontSize: 16 }}>
            Members ({members.length})
          </AppText>
          <Button size="sm" onPress={() => setAddOpen(true)}>
            Add member
          </Button>
        </View>

        {membersLoading ? (
          <LoadingSpinner label="Loading members" />
        ) : members.length === 0 ? (
          <EmptyMessage>No members on this team yet.</EmptyMessage>
        ) : (
          members.map((m) => (
            <ListItemCard
              key={m.id}
              title={m.name}
              subtitle={[m.email, m.role, m.is_lead ? 'Team lead' : null]
                .filter(Boolean)
                .join(' • ')}
              trailing={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  {m.is_lead ? <Badge variant="primary">Lead</Badge> : null}
                  <Pressable
                    onPress={() =>
                      void handleSetLead(m.is_lead ? null : m.agent_id)
                    }
                    hitSlop={hitSlop}
                    accessibilityLabel={m.is_lead ? 'Clear team lead' : 'Make team lead'}
                    style={{ padding: spacing.xs }}
                  >
                    <Ionicons
                      name={m.is_lead ? 'star' : 'star-outline'}
                      size={20}
                      color={m.is_lead ? colors.primary : colors.secondaryForeground}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => handleRemoveMember(m.id, m.agent_id, m.name)}
                    hitSlop={hitSlop}
                    accessibilityLabel={`Remove ${m.name}`}
                    style={{ padding: spacing.xs }}
                  >
                    <Ionicons name="person-remove-outline" size={20} color={colors.destructive} />
                  </Pressable>
                </View>
              }
            />
          ))
        )}
      </KeyboardAwareSheet>

      <KeyboardAwareSheet
        visible={open && addOpen}
        onClose={() => {
          setAddOpen(false);
          setMemberSearch('');
        }}
      >
        <AppText style={{ fontWeight: '700', fontSize: 18, marginBottom: spacing.sm }}>
          Add member
        </AppText>
        <AppText variant="secondary" style={{ fontSize: 14, marginBottom: spacing.md }}>
          Assigning someone who is already on another team will move them here.
        </AppText>
        <Input
          placeholder="Search workspace users..."
          value={memberSearch}
          onChangeText={setMemberSearch}
        />
        {candidateUsers.length === 0 ? (
          <EmptyMessage>
            {memberSearch.trim() ? 'No matching users.' : 'Everyone is already on this team.'}
          </EmptyMessage>
        ) : (
          candidateUsers.map((u) => (
            <ListItemCard
              key={u.user_id}
              title={u.name}
              subtitle={[u.email, u.role, u.current_team_name ? `On ${u.current_team_name}` : null]
                .filter(Boolean)
                .join(' • ')}
              trailing={
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => void handleAddMember(u.user_id, u.current_team_name)}
                >
                  {u.current_team_name ? 'Move' : 'Add'}
                </Button>
              }
            />
          ))
        )}
      </KeyboardAwareSheet>
    </>
  );
}
