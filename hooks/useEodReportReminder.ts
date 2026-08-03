import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useUserRole } from '@/hooks/useUserRole';
import {
  cancelEodReportReminder,
  scheduleEodReportReminder,
} from '@/services/localNotifications';

/**
 * Agents get one local daily nudge near shift end to submit evening/closing report.
 * Supervisors do not receive this reminder.
 */
export function useEodReportReminder() {
  const { user } = useAuth();
  const { isAgent, isSupervisor, loading } = useUserRole();

  useEffect(() => {
    if (loading) return;

    if (!user || isSupervisor || !isAgent) {
      void cancelEodReportReminder();
      return;
    }

    void scheduleEodReportReminder().catch((err) => {
      console.warn('[eod] failed to schedule report reminder', err);
    });
  }, [user, isAgent, isSupervisor, loading]);
}
