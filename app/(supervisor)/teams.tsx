import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ComponentGate } from '@/components/ComponentGate';
import { TeamDetailSheet } from '@/components/supervisor/TeamDetailSheet';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import {
  TEAM_TYPE_OPTIONS,
  TeamType,
  WorkspaceTeam,
  teamTypeLabel,
  useTeamMutations,
  useWorkspaceTeamsFull,
  useWorkspaceUsersForTeams,
} from '@/hooks/useTeams';
import { supabase } from '@/lib/supabase';
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
  Screen,
} from '@/components/ui';
import { appAlert } from '@/components/ui/AppAlert';
import { colors, hitSlop, spacing } from '@/theme';

export default function TeamsScreen() {
  const router = useRouter();
  const { currentWorkspaceId, currentProjectId } = useWorkspace();
  const { data: teams = [], isLoading, refetch } = useWorkspaceTeamsFull(currentWorkspaceId);
  const { data: workspaceUsers = [] } = useWorkspaceUsersForTeams(currentWorkspaceId);
  const { createTeam } = useTeamMutations(currentWorkspaceId);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<WorkspaceTeam | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<TeamType>('hybrid');
  const [newLeadId, setNewLeadId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!currentWorkspaceId) return;

    const onChange = () => {
      void refetchRef.current();
    };

    // Unique topic each mount — supabase.channel(name) reuses an existing subscribed
    // channel, and calling .on() after subscribe() throws (Strict Mode / effect re-runs).
    const channel = supabase
      .channel(`supervisor-teams-${currentWorkspaceId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        onChange,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        onChange,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase();
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.lead_name?.toLowerCase().includes(q) ||
        teamTypeLabel(t.team_type).toLowerCase().includes(q),
    );
  }, [teams, searchQuery]);

  const selectedFromList = useMemo(() => {
    if (!selectedTeam) return null;
    return teams.find((t) => t.id === selectedTeam.id) ?? selectedTeam;
  }, [teams, selectedTeam]);

  const resetCreateForm = useCallback(() => {
    setNewName('');
    setNewDescription('');
    setNewType('hybrid');
    setNewLeadId(null);
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) {
      appAlert('Name required', 'Enter a team name.');
      return;
    }
    setCreating(true);
    try {
      await createTeam.mutateAsync({
        name: newName.trim(),
        description: newDescription.trim() || null,
        team_type: newType,
        team_lead_id: newLeadId,
        project_id: currentProjectId,
      });
      setCreateOpen(false);
      resetCreateForm();
    } catch (err) {
      appAlert('Create failed', err instanceof Error ? err.message : 'Could not create team.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ComponentGate code="CRM-0127">
      <Screen
        scroll
        showBack
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
            return;
          }
          router.replace('/(supervisor)/(tabs)/users' as never);
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            marginBottom: spacing.md,
            alignItems: 'center',
          }}
        >
          <Button size="sm" onPress={() => setCreateOpen(true)} style={{ flexGrow: 1 }}>
            Create team
          </Button>
        </View>

        <Input
          placeholder="Search teams..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {isLoading ? (
          <LoadingSpinner label="Loading teams" />
        ) : filtered.length === 0 ? (
          <EmptyMessage>
            {searchQuery.trim()
              ? 'No teams match your search.'
              : 'No teams yet. Create one to organize agents.'}
          </EmptyMessage>
        ) : (
          filtered.map((team) => (
            <ListItemCard
              key={team.id}
              title={team.name}
              subtitle={[
                `${team.member_count} member${team.member_count === 1 ? '' : 's'}`,
                team.lead_name ? `Lead: ${team.lead_name}` : null,
                teamTypeLabel(team.team_type),
              ]
                .filter(Boolean)
                .join(' • ')}
              onPress={() => setSelectedTeam(team)}
              trailing={
                <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                  {!team.is_active ? <Badge variant="warning">Inactive</Badge> : null}
                  <Ionicons name="chevron-forward" size={18} color={colors.secondaryForeground} />
                </View>
              }
            />
          ))
        )}

        <KeyboardAwareSheet
          visible={createOpen}
          onClose={() => {
            setCreateOpen(false);
            resetCreateForm();
          }}
        >
          <AppText style={{ fontWeight: '700', fontSize: 18, marginBottom: spacing.md }}>
            Create team
          </AppText>
          <Input label="Team name" value={newName} onChangeText={setNewName} />
          <Input
            label="Description"
            value={newDescription}
            onChangeText={setNewDescription}
            multiline
            style={{ minHeight: 72, textAlignVertical: 'top' }}
          />
          <ChipSelect
            label="Team type"
            options={TEAM_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={newType}
            onChange={(v) => setNewType(v as TeamType)}
          />

          <AppText style={{ fontWeight: '500', marginBottom: spacing.sm }}>
            Team lead (optional)
          </AppText>
          <Pressable
            onPress={() => setNewLeadId(null)}
            hitSlop={hitSlop}
            style={{
              minHeight: 48,
              justifyContent: 'center',
              marginBottom: spacing.xs,
              paddingHorizontal: spacing.sm,
              borderRadius: 8,
              backgroundColor: newLeadId == null ? colors.accent : 'transparent',
            }}
          >
            <AppText style={{ fontWeight: newLeadId == null ? '600' : '400' }}>No lead yet</AppText>
          </Pressable>
          {workspaceUsers.slice(0, 12).map((u) => (
            <Pressable
              key={u.user_id}
              onPress={() => setNewLeadId(u.user_id)}
              hitSlop={hitSlop}
              style={{
                minHeight: 48,
                justifyContent: 'center',
                marginBottom: spacing.xs,
                paddingHorizontal: spacing.sm,
                borderRadius: 8,
                backgroundColor: newLeadId === u.user_id ? colors.accent : 'transparent',
              }}
            >
              <AppText style={{ fontWeight: newLeadId === u.user_id ? '600' : '400' }}>
                {u.name}
              </AppText>
              {u.email ? (
                <AppText variant="secondary" style={{ fontSize: 12 }}>
                  {u.email}
                </AppText>
              ) : null}
            </Pressable>
          ))}
          {workspaceUsers.length > 12 ? (
            <AppText variant="secondary" style={{ fontSize: 12, marginBottom: spacing.sm }}>
              Showing first 12 users. You can set the lead after creating the team.
            </AppText>
          ) : null}

          <Button loading={creating} onPress={() => void handleCreate()}>
            Create team
          </Button>
        </KeyboardAwareSheet>

        <TeamDetailSheet
          open={!!selectedFromList}
          team={selectedFromList}
          onClose={() => setSelectedTeam(null)}
        />
      </Screen>
    </ComponentGate>
  );
}
