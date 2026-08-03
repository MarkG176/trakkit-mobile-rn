import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

export function useUnreadNotifications() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      if (currentWorkspaceId) {
        query = query.or(`workspace_id.eq.${currentWorkspaceId},workspace_id.is.null`);
      }
      const { count, error } = await query;
      if (error) throw error;
      setUnreadCount(count ?? 0);
    } catch (error) {
      console.error('[notifications] Failed to load unread count', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentWorkspaceId]);

  useEffect(() => {
    void fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') void fetchCount();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [fetchCount]);

  useRealtimeSubscription({
    table: 'notifications',
    event: '*',
    filter: user?.id ? `recipient_id=eq.${user.id}` : undefined,
    onPayload: fetchCount,
  });

  return { unreadCount, loading, refresh: fetchCount };
}

export async function markNotificationsRead(params: {
  userId: string;
  types?: string[];
  workspaceId?: string | null;
}): Promise<void> {
  let query = supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', params.userId)
    .eq('is_read', false);

  if (params.types?.length) {
    query = query.in('type', params.types);
  }
  if (params.workspaceId) {
    query = query.or(`workspace_id.eq.${params.workspaceId},workspace_id.is.null`);
  }

  const { error } = await query;
  if (error) {
    console.error('[notifications] Failed to mark read', error);
  }
}
