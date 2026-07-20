// [CRM-0005] Background Location Tracker — 15-min background GPS while checked in
import { useEffect } from 'react';
import { useAgentStatus } from '@/providers/AgentStatusProvider';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { startBackgroundTracking, stopBackgroundTracking } from '@/tasks/backgroundLocation';

/** Starts/stops background GPS when agent is checked in (gated by CRM-0005). */
export function BackgroundLocationTracker() {
  const { isCheckedIn } = useAgentStatus();
  const { isEnabled } = useProjectComponents();

  useEffect(() => {
    if (!isEnabled('CRM-0005')) return;

    if (isCheckedIn) {
      startBackgroundTracking().catch((err) =>
        console.warn('Background location failed to start:', err),
      );
    } else {
      stopBackgroundTracking().catch((err) =>
        console.warn('Background location failed to stop:', err),
      );
    }

    return () => {
      stopBackgroundTracking().catch(() => {});
    };
  }, [isCheckedIn, isEnabled]);

  return null;
}
