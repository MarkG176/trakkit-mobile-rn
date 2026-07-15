import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface PerformanceData {
  tasksToday: number;
  surveysCompleted: number;
  salesTarget: { current: number; target: number };
}

export function useDashboardData() {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    tasksToday: 0,
    surveysCompleted: 0,
    salesTarget: { current: 0, target: 0 },
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const [tasksRes, surveysRes, salesRes, currentTaskRes] = await Promise.all([
        supabase
          .from('agent_tasks')
          .select('id')
          .eq('agent_id', user.id)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`),
        supabase
          .from('interactions')
          .select('id, agent_tasks!inner(agent_id)')
          .eq('agent_tasks.agent_id', user.id)
          .eq('interaction_type', 'survey')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`),
        supabase
          .from('interactions')
          .select('id, agent_tasks!inner(agent_id)')
          .eq('agent_tasks.agent_id', user.id)
          .eq('interaction_type', 'sale')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`),
        supabase
          .from('agent_tasks')
          .select('individual_sales_target')
          .eq('agent_id', user.id)
          .eq('status', 'pending')
          .maybeSingle(),
      ]);

      setPerformanceData({
        tasksToday: tasksRes.data?.length ?? 0,
        surveysCompleted: surveysRes.data?.length ?? 0,
        salesTarget: {
          current: salesRes.data?.length ?? 0,
          target: currentTaskRes.data?.individual_sales_target ?? 10,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { performanceData, loading, refetch: fetchDashboardData };
}
