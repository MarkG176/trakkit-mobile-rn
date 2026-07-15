import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';

export function useTodayTasksStat() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user || !currentWorkspaceId) {
      setCompleted(0);
      setTotal(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('agent_tasks')
        .select('id, status, completed_at')
        .eq('agent_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      const rows = data ?? [];
      setTotal(rows.length);
      setCompleted(
        rows.filter((task) => task.status === 'completed' || task.completed_at != null).length,
      );
    } catch (error) {
      console.error('Error fetching today tasks stat:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspaceId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { completed, total, loading, refetch: fetchTasks };
}
