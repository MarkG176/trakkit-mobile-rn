import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MOBILE_COMPONENTS } from '@/data/mobileComponentsCatalog';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useAgentStatus } from '@/providers/AgentStatusProvider';
import { workspaceService } from '@/services/workspaceService';

export interface ExpectedActivity {
  code: string;
  name: string;
  completed: boolean;
}

type ActivityCounts = {
  attendanceCheckIns: number;
  attendanceCheckOuts: number;
  sales: number;
  giveaways: number;
  engagementGiveaways: number;
  surveys: number;
  interactions: number;
  dailyReports: number;
  priceReports: number;
};

const EMPTY_COUNTS: ActivityCounts = {
  attendanceCheckIns: 0,
  attendanceCheckOuts: 0,
  sales: 0,
  giveaways: 0,
  engagementGiveaways: 0,
  surveys: 0,
  interactions: 0,
  dailyReports: 0,
  priceReports: 0,
};

/** Attendance check-in/out are shown as two separate 1-point activities. */
const ATTENDANCE_ACTIVITY_CODES = new Set(['CRM-0010', 'CRM-0026']);

const REPORT_VISIBILITY: Record<string, (teamType: string, inStore: boolean) => boolean> = {
  'CRM-0019': (teamType) =>
    !teamType.includes('instore') && !teamType.includes('seeding') && !teamType.includes('survey'),
  'CRM-0020': (teamType, inStore) => teamType.includes('instore') || inStore,
  'CRM-0021': (teamType, inStore) => teamType.includes('instore') || inStore,
  'CRM-0022': () => true,
  'CRM-0023': (teamType) => teamType.includes('survey'),
  'CRM-0024': (teamType) => teamType.includes('seeding'),
  'CRM-0025': () => true,
};

const COMPLETION_BY_CODE: Record<string, (counts: ActivityCounts) => boolean> = {
  'CRM-0034': (c) => c.sales > 0,
  'CRM-0034G': (c) => c.giveaways > 0,
  'CRM-0097': (c) => c.surveys > 0,
  'CRM-0096': (c) => c.interactions > 0,
  'CRM-0030': (c) => c.engagementGiveaways > 0,
  'CRM-0019': (c) => c.dailyReports > 0,
  'CRM-0020': (c) => c.dailyReports > 0,
  'CRM-0021': (c) => c.dailyReports > 0,
  'CRM-0022': (c) => c.dailyReports > 0,
  'CRM-0023': (c) => c.dailyReports > 0,
  'CRM-0024': (c) => c.dailyReports > 0,
  'CRM-0025': (c) => c.priceReports > 0,
};

function isActivityVisible(code: string, teamType: string, inStore: boolean): boolean {
  const reportFilter = REPORT_VISIBILITY[code];
  if (reportFilter) return reportFilter(teamType, inStore);
  return true;
}

export function useExpectedActivities() {
  const { user } = useAuth();
  const { currentWorkspaceId, currentWorkspaceLabel } = useWorkspace();
  const { isCheckedIn } = useAgentStatus();
  const [counts, setCounts] = useState<ActivityCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);

  const teamType = currentWorkspaceLabel?.toLowerCase() ?? '';
  const inStore = workspaceService.isCurrentWorkspaceInStoreMode();

  const enabledActivities = useMemo(
    () =>
      MOBILE_COMPONENTS.filter(
        (component) =>
          component.group === 'agent-action' &&
          isActivityVisible(component.code, teamType, inStore),
      ),
    [teamType, inStore],
  );

  const loadCounts = useCallback(async () => {
    if (!user || !currentWorkspaceId) {
      setCounts(EMPTY_COUNTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();
    const todayDate = todayIso.split('T')[0];

    try {
      const [
        attendanceCheckIns,
        attendanceCheckOuts,
        sales,
        giveaways,
        engagementGiveaways,
        surveys,
        interactions,
        dailyReports,
        priceReports,
      ] = await Promise.all([
        supabase
          .from('agent_status_log')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('status', 'checked_in')
          .gte('timestamp', todayIso),
        supabase
          .from('agent_status_log')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('status', 'checked_out')
          .gte('timestamp', todayIso),
        supabase
          .from('interactions')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('interaction_type', 'sale')
          .not('is_deleted', 'is', true)
          .gte('created_at', todayIso),
        supabase
          .from('giveaways')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', todayIso),
        supabase
          .from('giveaways')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .or('engagement_quality.not.is.null,engagement_duration.not.is.null')
          .gte('created_at', todayIso),
        supabase
          .from('survey_responses')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('is_completed', true)
          .not('is_deleted', 'is', true)
          .or(`completed_at.gte.${todayIso},and(completed_at.is.null,created_at.gte.${todayIso})`),
        supabase
          .from('interactions')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .not('is_deleted', 'is', true)
          .gte('created_at', todayIso),
        supabase
          .from('daily_stock_reports')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('work_date', todayDate),
        supabase
          .from('store_price_reports')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', todayIso),
      ]);

      setCounts({
        attendanceCheckIns: attendanceCheckIns.count ?? 0,
        attendanceCheckOuts: attendanceCheckOuts.count ?? 0,
        sales: sales.count ?? 0,
        giveaways: giveaways.count ?? 0,
        engagementGiveaways: engagementGiveaways.count ?? 0,
        surveys: surveys.count ?? 0,
        interactions: interactions.count ?? 0,
        dailyReports: dailyReports.count ?? 0,
        priceReports: priceReports.count ?? 0,
      });
    } catch (error) {
      console.error('Error loading expected activities:', error);
      setCounts(EMPTY_COUNTS);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspaceId]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts, isCheckedIn]);

  const activities: ExpectedActivity[] = useMemo(() => {
    const hasAttendanceAction = enabledActivities.some((component) =>
      ATTENDANCE_ACTIVITY_CODES.has(component.code),
    );

    const otherActivities = enabledActivities
      .filter((component) => !ATTENDANCE_ACTIVITY_CODES.has(component.code))
      .map((component) => ({
        code: component.code,
        name: component.name,
        completed: COMPLETION_BY_CODE[component.code]?.(counts) ?? false,
      }));

    if (!hasAttendanceAction) return otherActivities;

    return [
      {
        code: 'attendance-check-in',
        name: 'Check In',
        completed: counts.attendanceCheckIns > 0,
      },
      {
        code: 'attendance-check-out',
        name: 'Check Out',
        completed: counts.attendanceCheckOuts > 0,
      },
      ...otherActivities,
    ];
  }, [enabledActivities, counts]);

  const completedCount = activities.filter((activity) => activity.completed).length;

  return {
    activities,
    completedCount,
    totalCount: activities.length,
    loading,
    refresh: loadCounts,
  };
}
