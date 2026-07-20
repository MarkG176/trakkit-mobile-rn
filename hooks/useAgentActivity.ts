import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';

export interface AgentActivityItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string | null;
  timestamp: string;
  thumbnailUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Agent's own activity feed (interactions + status) for CRM-0091.
 */
export function useAgentActivity(limit = 50) {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();

  return useQuery({
    queryKey: ['agent-activity', user?.id, currentWorkspaceId, limit],
    enabled: Boolean(user?.id && currentWorkspaceId),
    queryFn: async (): Promise<AgentActivityItem[]> => {
      if (!user?.id || !currentWorkspaceId) return [];

      const { data: interactions, error } = await supabase
        .from('interactions')
        .select(
          'id, interaction_type, customer_name, sale_value, quantity_sold, image_url, created_at, outcome, metadata',
        )
        .eq('agent_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (interactions || []).map((row) => ({
        id: row.id,
        type: row.interaction_type || 'interaction',
        title:
          row.customer_name ||
          (row.interaction_type === 'sale'
            ? 'Sale'
            : row.interaction_type === 'giveaway'
              ? 'Giveaway'
              : 'Interaction'),
        subtitle:
          row.sale_value != null
            ? `${row.quantity_sold ?? 0} units · ${row.sale_value}`
            : row.outcome,
        timestamp: row.created_at ?? '',
        thumbnailUrl: row.image_url,
        metadata: (row.metadata as Record<string, unknown>) || null,
      }));
    },
  });
}

export interface AgentActivity {
  id: string;
  agent_id: string;
  agent_display_name: string | null;
  status: string;
  timestamp: string;
  location_lat: number | null;
  location_lng: number | null;
  selfie_url: string | null;
  store_id: string | null;
  check_in_successful: boolean | null;
  distance_from_assigned: number | null;
  in_range: boolean | null;
  team_id: string | null;
  store_name?: string | null;
}

const PAGE_SIZE = 50;

/** Supervisor-facing activities feed (PWA useAgentActivities). */
export const useAgentActivities = (
  workspaceId: string | null,
  page: number,
  filterDate: string | null,
  searchQuery: string = '',
  teamId: string | null = null,
) => {
  return useQuery({
    queryKey: ['agent-activities', workspaceId, page, filterDate, searchQuery, teamId],
    queryFn: async () => {
      if (!workspaceId || !filterDate) return { data: [] as AgentActivity[], count: 0 };

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('agent_status_log')
        .select('*, stores:store_id(store_name)', { count: 'exact' })
        .eq('workspace_id', workspaceId)
        .gte('timestamp', `${filterDate}T00:00:00`)
        .lt('timestamp', `${filterDate}T23:59:59.999`)
        .order('timestamp', { ascending: false })
        .range(from, to);

      if (teamId) query = query.eq('team_id', teamId);

      if (searchQuery.trim()) {
        query = query.ilike('agent_display_name', `%${searchQuery.trim()}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const activities: AgentActivity[] = (data || []).map((row: any) => ({
        id: row.id,
        agent_id: row.agent_id,
        agent_display_name: row.agent_display_name,
        status: row.status,
        timestamp: row.timestamp,
        location_lat: row.location_lat,
        location_lng: row.location_lng,
        selfie_url: row.selfie_url,
        store_id: row.store_id,
        check_in_successful: row.check_in_successful,
        distance_from_assigned: row.distance_from_assigned,
        in_range: row.in_range,
        team_id: row.team_id,
        store_name: row.stores?.store_name || null,
      }));

      return { data: activities, count: count || 0 };
    },
    enabled: !!workspaceId && !!filterDate,
  });
};

/** Supervisor gallery selfies — date range via startISO/endISO (all-time when both omitted). */
export const useGalleryImages = (
  workspaceId: string | null,
  startISO?: string | null,
  endISO?: string | null,
) => {
  return useQuery({
    queryKey: ['gallery-images', workspaceId, startISO, endISO],
    queryFn: async () => {
      if (!workspaceId) return [];

      let query = supabase
        .from('agent_status_log')
        .select('id, agent_display_name, selfie_url, timestamp, status')
        .eq('workspace_id', workspaceId)
        .not('selfie_url', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (startISO) query = query.gte('timestamp', startISO);
      if (endISO) query = query.lte('timestamp', endISO);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });
};
