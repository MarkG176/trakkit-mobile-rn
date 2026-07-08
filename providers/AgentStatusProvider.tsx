import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';

interface AgentStatusContextType {
  isCheckedIn: boolean;
  lastCheckInAt: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AgentStatusContext = createContext<AgentStatusContextType | undefined>(undefined);

export function AgentStatusProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastCheckInAt, setLastCheckInAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!user || !currentWorkspaceId) {
      setIsCheckedIn(false);
      setLastCheckInAt(null);
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from('agent_status_log')
        .select('status, created_at, timestamp')
        .eq('agent_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      const checkedIn = data?.status === 'checked_in';
      setIsCheckedIn(checkedIn);
      setLastCheckInAt(data?.created_at ?? data?.timestamp ?? null);
    } catch (error) {
      console.error('Error fetching agent status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [user?.id, currentWorkspaceId]);

  return (
    <AgentStatusContext.Provider value={{ isCheckedIn, lastCheckInAt, loading, refresh }}>
      {children}
    </AgentStatusContext.Provider>
  );
}

export function useAgentStatus() {
  const context = useContext(AgentStatusContext);
  if (!context) throw new Error('useAgentStatus must be used within AgentStatusProvider');
  return context;
}
