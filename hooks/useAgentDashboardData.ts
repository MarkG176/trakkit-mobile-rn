import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MOBILE_COMPONENTS } from '@/data/mobileComponentsCatalog';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useAgentStatus } from '@/providers/AgentStatusProvider';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { workspaceService } from '@/services/workspaceService';

export type StatusLog = {
  status: string | null;
  timestamp: string | null;
  created_at: string | null;
};

export interface ExpectedActivity {
  code: string;
  name: string;
  completed: boolean;
}

export interface SalesTarget {
  current: number;
  target: number;
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

export function calculateTodayHours(logs: StatusLog[], now = Date.now()): number {
  if (!logs.length) return 0;

  let totalMinutes = 0;
  let currentCheckIn: StatusLog | null = null;

  for (const log of logs) {
    if (log.status === 'checked_in' && !currentCheckIn) {
      currentCheckIn = log;
    } else if ((log.status === 'lunch' || log.status === 'checked_out') && currentCheckIn) {
      const start = new Date(currentCheckIn.timestamp ?? currentCheckIn.created_at ?? '').getTime();
      const end = new Date(log.timestamp ?? log.created_at ?? '').getTime();
      totalMinutes += Math.max(0, (end - start) / 60000);
      currentCheckIn = null;
    }
  }

  if (currentCheckIn) {
    const start = new Date(currentCheckIn.timestamp ?? currentCheckIn.created_at ?? '').getTime();
    totalMinutes += Math.max(0, (now - start) / 60000);
  }

  return totalMinutes / 60;
}

export function hasOpenCheckIn(logs: StatusLog[]): boolean {
  let open = false;
  for (const log of logs) {
    if (log.status === 'checked_in') open = true;
    else if (log.status === 'lunch' || log.status === 'checked_out') open = false;
  }
  return open;
}

function buildActivities(
  enabledActivities: { code: string; name: string }[],
  counts: ActivityCounts,
): ExpectedActivity[] {
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
}

export function useAgentDashboardData() {
  const { user } = useAuth();
  const { currentWorkspaceId, currentWorkspaceLabel, isInitialized } = useWorkspace();
  const { isCheckedIn } = useAgentStatus();
  const { isEnabled } = useProjectComponents();

  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
  const [counts, setCounts] = useState<ActivityCounts>(EMPTY_COUNTS);
  const [salesTarget, setSalesTarget] = useState<SalesTarget>({ current: 0, target: 10 });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  const teamType = currentWorkspaceLabel?.toLowerCase() ?? '';
  const inStore = workspaceService.isCurrentWorkspaceInStoreMode();

  const enabledActivities = useMemo(
    () =>
      MOBILE_COMPONENTS.filter(
        (component) =>
          component.group === 'agent-action' &&
          isEnabled(component.code) &&
          isActivityVisible(component.code, teamType, inStore),
      ),
    [teamType, inStore, isEnabled],
  );

  const fetchAll = useCallback(async () => {
    if (!user || !currentWorkspaceId) {
      setStatusLogs([]);
      setCounts(EMPTY_COUNTS);
      setSalesTarget({ current: 0, target: 10 });
      setUnreadMessages(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayIso = startOfDay.toISOString();
    const todayDate = todayIso.split('T')[0];

    try {
      const [
        statusRes,
        salesRes,
        giveawaysRes,
        engagementGiveawaysRes,
        surveysRes,
        interactionsRes,
        dailyReportsRes,
        priceReportsRes,
        salesTargetRes,
        messagesRes,
      ] = await Promise.all([
        supabase
          .from('agent_status_log')
          .select('status, timestamp, created_at')
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('timestamp', todayIso)
          .order('timestamp', { ascending: true }),
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
        supabase
          .from('agent_tasks')
          .select('individual_sales_target')
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('status', 'pending')
          .maybeSingle(),
        supabase
          .from('supervisor_messages')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('is_deleted', false)
          .eq('is_read', false),
      ]);

      const logs = statusRes.data ?? [];
      const salesCount = salesRes.count ?? 0;
      setStatusLogs(logs);
      setCounts({
        attendanceCheckIns: logs.filter((log) => log.status === 'checked_in').length,
        attendanceCheckOuts: logs.filter((log) => log.status === 'checked_out').length,
        sales: salesCount,
        giveaways: giveawaysRes.count ?? 0,
        engagementGiveaways: engagementGiveawaysRes.count ?? 0,
        surveys: surveysRes.count ?? 0,
        interactions: interactionsRes.count ?? 0,
        dailyReports: dailyReportsRes.count ?? 0,
        priceReports: priceReportsRes.count ?? 0,
      });
      setSalesTarget({
        current: salesCount,
        target: salesTargetRes.data?.individual_sales_target ?? 10,
      });
      setUnreadMessages(messagesRes.count ?? 0);
    } catch (error) {
      console.error('Error loading agent dashboard data:', error);
      setStatusLogs([]);
      setCounts(EMPTY_COUNTS);
      setSalesTarget({ current: 0, target: 10 });
      setUnreadMessages(0);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspaceId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, isCheckedIn]);

  const activities = useMemo(
    () => buildActivities(enabledActivities, counts),
    [enabledActivities, counts],
  );
  const completedCount = activities.filter((activity) => activity.completed).length;

  return {
    loading: !isInitialized || loading,
    statusLogs,
    activities,
    completedCount,
    totalCount: activities.length,
    salesTarget,
    unreadMessages,
    refetch: fetchAll,
  };
}
