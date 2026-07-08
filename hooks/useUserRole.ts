import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export type AppRole = 'agent' | 'supervisor' | 'admin' | null;

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          setRole('agent');
        } else {
          setRole((data?.role as AppRole) ?? 'agent');
        }
      } catch {
        setRole('agent');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) fetchRole();
  }, [user, authLoading]);

  const isSupervisor = role === 'supervisor' || role === 'admin';
  const isAgent = role === 'agent' || (!isSupervisor && role !== null);

  return { role, loading: authLoading || loading, isSupervisor, isAgent };
}
