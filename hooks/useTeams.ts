import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const TEAM_TYPE_OPTIONS = [
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'instore', label: 'In-store' },
  { value: 'sales_activation', label: 'Sales activation' },
  { value: 'brand_activation', label: 'Brand activation' },
  { value: 'door_to_door', label: 'Door to door' },
  { value: 'sampling', label: 'Sampling' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'seeding', label: 'Seeding' },
  { value: 'survey', label: 'Survey' },
  { value: 'survey_campaign', label: 'Survey campaign' },
  { value: 'market_research', label: 'Market research' },
] as const;

export type TeamType = (typeof TEAM_TYPE_OPTIONS)[number]['value'];

export type WorkspaceTeam = {
  id: string;
  name: string;
  description: string | null;
  team_type: string;
  team_lead_id: string | null;
  is_active: boolean;
  member_count: number;
  lead_name: string | null;
};

export type TeamMember = {
  id: string;
  agent_id: string;
  name: string;
  email: string | null;
  role: string | null;
  is_active: boolean;
  is_lead: boolean;
};

export type WorkspaceUserOption = {
  user_id: string;
  name: string;
  email: string | null;
  role: string;
  current_team_id: string | null;
  current_team_name: string | null;
};

export type CreateTeamInput = {
  name: string;
  description?: string | null;
  team_type?: TeamType;
  team_lead_id?: string | null;
  project_id?: string | null;
};

export type UpdateTeamInput = {
  name?: string;
  description?: string | null;
  team_type?: TeamType;
  team_lead_id?: string | null;
  is_active?: boolean;
};

const teamsKey = (workspaceId: string | null) => ['workspace-teams-full', workspaceId] as const;
const membersKey = (teamId: string | null) => ['team-members', teamId] as const;
const workspaceUsersKey = (workspaceId: string | null) =>
  ['workspace-users-for-teams', workspaceId] as const;

function displayName(name: string | null | undefined, email: string | null | undefined): string {
  return name?.trim() || email?.split('@')[0] || 'Unknown';
}

function teamTypeLabel(type: string): string {
  return TEAM_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type.replace(/_/g, ' ');
}

export { teamTypeLabel };

async function recountTeamMembers(teamId: string): Promise<number> {
  const { count, error } = await supabase
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .eq('is_active', true);
  if (error) throw error;
  const next = count ?? 0;
  await supabase.from('teams').update({ member_count: next }).eq('id', teamId);
  return next;
}

async function fetchWorkspaceTeams(workspaceId: string): Promise<WorkspaceTeam[]> {
  const { data: teamsData, error } = await supabase
    .from('teams')
    .select('id, name, description, team_type, team_lead_id, is_active, member_count')
    .eq('workspace_id', workspaceId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('name');
  if (error) throw error;

  const teams = teamsData ?? [];
  const teamIds = teams.map((t) => t.id);
  const leadIds = [...new Set(teams.map((t) => t.team_lead_id).filter(Boolean))] as string[];

  const counts: Record<string, number> = {};
  const leadNames: Record<string, string> = {};

  if (teamIds.length > 0) {
    const { data: tm, error: tmError } = await supabase
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .eq('is_active', true);
    if (tmError) throw tmError;
    (tm ?? []).forEach((m) => {
      if (!m.team_id) return;
      counts[m.team_id] = (counts[m.team_id] || 0) + 1;
    });
  }

  if (leadIds.length > 0) {
    const [{ data: roles }, { data: uw }] = await Promise.all([
      supabase.from('user_roles').select('user_id, display_name, email').in('user_id', leadIds),
      supabase
        .from('user_workspaces')
        .select('user_id, name, email')
        .eq('workspace_id', workspaceId)
        .in('user_id', leadIds),
    ]);
    const byUw = new Map((uw ?? []).map((r) => [r.user_id!, r]));
    (roles ?? []).forEach((r) => {
      const fromUw = r.user_id ? byUw.get(r.user_id) : undefined;
      leadNames[r.user_id] = displayName(
        fromUw?.name ?? r.display_name,
        fromUw?.email ?? r.email,
      );
    });
  }

  return teams.map((t) => ({
    id: t.id,
    name: t.name?.trim() || 'Untitled team',
    description: t.description,
    team_type: t.team_type,
    team_lead_id: t.team_lead_id,
    is_active: t.is_active ?? true,
    member_count: counts[t.id] ?? t.member_count ?? 0,
    lead_name: t.team_lead_id ? leadNames[t.team_lead_id] ?? null : null,
  }));
}

async function fetchTeamMembers(teamId: string, teamLeadId: string | null): Promise<TeamMember[]> {
  const { data: rows, error } = await supabase
    .from('team_members')
    .select('id, agent_id, is_active, workspace_id')
    .eq('team_id', teamId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('created_at', { ascending: true });
  if (error) throw error;

  const agentIds = [...new Set((rows ?? []).map((r) => r.agent_id).filter(Boolean))] as string[];
  if (agentIds.length === 0) return [];

  const workspaceId = rows?.[0]?.workspace_id ?? null;
  const [{ data: uw }, { data: roles }] = await Promise.all([
    workspaceId
      ? supabase
          .from('user_workspaces')
          .select('user_id, name, email, role')
          .eq('workspace_id', workspaceId)
          .in('user_id', agentIds)
      : Promise.resolve({ data: null }),
    supabase.from('user_roles').select('user_id, display_name, email').in('user_id', agentIds),
  ]);

  const uwMap = new Map((uw ?? []).map((r) => [r.user_id!, r]));
  const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r]));

  return (rows ?? [])
    .filter((r): r is typeof r & { agent_id: string } => !!r.agent_id)
    .map((r) => {
      const fromUw = uwMap.get(r.agent_id);
      const fromRole = roleMap.get(r.agent_id);
      return {
        id: r.id,
        agent_id: r.agent_id,
        name: displayName(fromUw?.name ?? fromRole?.display_name, fromUw?.email ?? fromRole?.email),
        email: fromUw?.email ?? fromRole?.email ?? null,
        role: fromUw?.role ?? null,
        is_active: r.is_active ?? true,
        is_lead: teamLeadId === r.agent_id,
      };
    });
}

async function fetchWorkspaceUsersForTeams(workspaceId: string): Promise<WorkspaceUserOption[]> {
  const [{ data: members, error: membersError }, { data: memberships, error: tmError }] =
    await Promise.all([
      supabase
        .from('user_workspaces')
        .select('user_id, name, email, role, is_active')
        .eq('workspace_id', workspaceId)
        .eq('is_deleted', false)
        .eq('is_active', true),
      supabase
        .from('team_members')
        .select('agent_id, team_id, teams:team_id(id, name, is_deleted)')
        .eq('workspace_id', workspaceId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .eq('is_active', true),
    ]);
  if (membersError) throw membersError;
  if (tmError) throw tmError;

  const teamByAgent = new Map<string, { id: string; name: string }>();
  (memberships ?? []).forEach((m) => {
    if (!m.agent_id) return;
    const teamRaw = m.teams as
      | { id: string; name: string | null; is_deleted: boolean | null }
      | { id: string; name: string | null; is_deleted: boolean | null }[]
      | null;
    const team = Array.isArray(teamRaw) ? teamRaw[0] : teamRaw;
    if (!team || team.is_deleted) return;
    teamByAgent.set(m.agent_id, { id: team.id, name: team.name?.trim() || 'Team' });
  });

  return (members ?? [])
    .filter((m): m is typeof m & { user_id: string } => !!m.user_id)
    .map((m) => {
      const current = teamByAgent.get(m.user_id);
      return {
        user_id: m.user_id,
        name: displayName(m.name, m.email),
        email: m.email,
        role: m.role,
        current_team_id: current?.id ?? null,
        current_team_name: current?.name ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function useWorkspaceTeamsFull(workspaceId: string | null) {
  return useQuery({
    queryKey: teamsKey(workspaceId),
    queryFn: () => fetchWorkspaceTeams(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useTeamMembers(teamId: string | null, teamLeadId: string | null) {
  return useQuery({
    queryKey: [...membersKey(teamId), teamLeadId],
    queryFn: () => fetchTeamMembers(teamId!, teamLeadId),
    enabled: !!teamId,
  });
}

export function useWorkspaceUsersForTeams(workspaceId: string | null) {
  return useQuery({
    queryKey: workspaceUsersKey(workspaceId),
    queryFn: () => fetchWorkspaceUsersForTeams(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useTeamMutations(workspaceId: string | null) {
  const queryClient = useQueryClient();

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: teamsKey(workspaceId) }),
      queryClient.invalidateQueries({ queryKey: ['workspace-teams', workspaceId] }),
      queryClient.invalidateQueries({ queryKey: workspaceUsersKey(workspaceId) }),
      queryClient.invalidateQueries({ queryKey: ['team-members'] }),
    ]);
  }, [queryClient, workspaceId]);

  const createTeam = useMutation({
    mutationFn: async (input: CreateTeamInput) => {
      if (!workspaceId) throw new Error('No workspace selected');
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          workspace_id: workspaceId,
          project_id: input.project_id ?? null,
          team_type: input.team_type ?? 'hybrid',
          team_lead_id: input.team_lead_id ?? null,
          is_active: true,
          is_deleted: false,
          member_count: 0,
        })
        .select('id')
        .single();
      if (error) throw error;

      if (input.team_lead_id) {
        const leadId = input.team_lead_id;
        await supabase
          .from('team_members')
          .update({ is_deleted: true, is_active: false })
          .eq('workspace_id', workspaceId)
          .eq('agent_id', leadId)
          .or('is_deleted.is.null,is_deleted.eq.false');

        const { data: existing } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', data.id)
          .eq('agent_id', leadId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('team_members')
            .update({ is_deleted: false, is_active: true })
            .eq('id', existing.id);
        } else {
          await supabase.from('team_members').insert({
            team_id: data.id,
            agent_id: leadId,
            workspace_id: workspaceId,
            is_active: true,
            is_deleted: false,
          });
        }
        await recountTeamMembers(data.id);
      }

      return data;
    },
    onSuccess: invalidate,
  });

  const updateTeam = useMutation({
    mutationFn: async ({ teamId, patch }: { teamId: string; patch: UpdateTeamInput }) => {
      const payload: {
        name?: string;
        description?: string | null;
        team_type?: TeamType;
        team_lead_id?: string | null;
        is_active?: boolean;
      } = {};
      if (patch.name !== undefined) payload.name = patch.name.trim();
      if (patch.description !== undefined) payload.description = patch.description?.trim() || null;
      if (patch.team_type !== undefined) payload.team_type = patch.team_type;
      if (patch.team_lead_id !== undefined) payload.team_lead_id = patch.team_lead_id;
      if (patch.is_active !== undefined) payload.is_active = patch.is_active;
      const { error } = await supabase.from('teams').update(payload).eq('id', teamId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => {
      const { error: teamError } = await supabase
        .from('teams')
        .update({ is_deleted: true, is_active: false })
        .eq('id', teamId);
      if (teamError) throw teamError;
      const { error: membersError } = await supabase
        .from('team_members')
        .update({ is_deleted: true, is_active: false })
        .eq('team_id', teamId)
        .or('is_deleted.is.null,is_deleted.eq.false');
      if (membersError) throw membersError;
    },
    onSuccess: invalidate,
  });

  const addMember = useMutation({
    mutationFn: async ({
      teamId,
      agentId,
      moveFromOtherTeams = true,
    }: {
      teamId: string;
      agentId: string;
      moveFromOtherTeams?: boolean;
    }) => {
      if (!workspaceId) throw new Error('No workspace selected');

      if (moveFromOtherTeams) {
        const { error: clearError } = await supabase
          .from('team_members')
          .update({ is_deleted: true, is_active: false })
          .eq('workspace_id', workspaceId)
          .eq('agent_id', agentId)
          .neq('team_id', teamId)
          .or('is_deleted.is.null,is_deleted.eq.false');
        if (clearError) throw clearError;
      }

      const { data: existing } = await supabase
        .from('team_members')
        .select('id, is_deleted, is_active')
        .eq('team_id', teamId)
        .eq('agent_id', agentId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('team_members')
          .update({ is_deleted: false, is_active: true })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('team_members').insert({
          team_id: teamId,
          agent_id: agentId,
          workspace_id: workspaceId,
          is_active: true,
          is_deleted: false,
        });
        if (error) throw error;
      }

      await recountTeamMembers(teamId);
    },
    onSuccess: invalidate,
  });

  const removeMember = useMutation({
    mutationFn: async ({
      membershipId,
      teamId,
      agentId,
      clearLead,
    }: {
      membershipId: string;
      teamId: string;
      agentId: string;
      clearLead: boolean;
    }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ is_deleted: true, is_active: false })
        .eq('id', membershipId);
      if (error) throw error;
      if (clearLead) {
        await supabase.from('teams').update({ team_lead_id: null }).eq('id', teamId).eq('team_lead_id', agentId);
      }
      await recountTeamMembers(teamId);
    },
    onSuccess: invalidate,
  });

  return { createTeam, updateTeam, deleteTeam, addMember, removeMember, invalidate };
}
