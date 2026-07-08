import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface RealtimeOptions {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onPayload: (payload: unknown) => void;
}

export function useRealtimeSubscription({
  table,
  filter,
  event = 'INSERT',
  onPayload,
}: RealtimeOptions) {
  useEffect(() => {
    const channelName = `realtime-${table}-${filter ?? 'all'}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        (payload) => onPayload(payload),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, event, onPayload]);
}
