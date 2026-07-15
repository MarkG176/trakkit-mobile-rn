import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface PerformanceData {
  tasksToday: number;
  surveysCompleted: number;
  salesTarget: { current: number; target: number };
}

async function fetchDashboardPerformance(userId: string): Promise<PerformanceData> {
  const today = new Date().toISOString().split('T')[0];

  const [tasksRes, surveysRes, salesRes, currentTaskRes] = await Promise.all([
    supabase
      .from('agent_tasks')
      .select('id')
      .eq('agent_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`),
    supabase
      .from('interactions')
      .select('id, agent_tasks!inner(agent_id)')
      .eq('agent_tasks.agent_id', userId)
      .eq('interaction_type', 'survey')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`),
    supabase
      .from('interactions')
      .select('id, agent_tasks!inner(agent_id)')
      .eq('agent_tasks.agent_id', userId)
      .eq('interaction_type', 'sale')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`),
    supabase
      .from('agent_tasks')
      .select('individual_sales_target')
      .eq('agent_id', userId)
      .eq('status', 'pending')
      .maybeSingle(),
  ]);

  return {
    tasksToday: tasksRes.data?.length ?? 0,
    surveysCompleted: surveysRes.data?.length ?? 0,
    salesTarget: {
      current: salesRes.data?.length ?? 0,
      target: currentTaskRes.data?.individual_sales_target ?? 10,
    },
  };
}

export function useDashboardData() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-performance', user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => fetchDashboardPerformance(user!.id),
  });

  const refetchDashboard = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    performanceData: data ?? {
      tasksToday: 0,
      surveysCompleted: 0,
      salesTarget: { current: 0, target: 10 },
    },
    loading: isLoading,
    refetch: refetchDashboard,
  };
}
