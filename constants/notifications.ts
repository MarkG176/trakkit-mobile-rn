/**
 * Allow-listed `notifications.type` values — must match
 * public.notifications_type_check and create_app_notification.
 *
 * Agent real-time: new_message (supervisor chat), sync_failure, report_reminder
 * Supervisor real-time: new_message (agent ticket), no_show, flagged_report
 * Both (batched): daily_digest
 */
export const NOTIFICATION_TYPES = {
  newMessage: 'new_message',
  syncFailure: 'sync_failure',
  reportReminder: 'report_reminder',
  noShow: 'no_show',
  flaggedReport: 'flagged_report',
  dailyDigest: 'daily_digest',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/** data.kind distinguishes which side of new_message */
export const MESSAGE_KINDS = {
  supervisorMessage: 'supervisor_message',
  agentTicket: 'agent_ticket',
} as const;

export function routeForNotificationType(
  type: string | undefined,
  isSupervisor: boolean,
  kind?: string,
): string {
  switch (type) {
    case NOTIFICATION_TYPES.newMessage:
      if (kind === MESSAGE_KINDS.agentTicket || isSupervisor) {
        return '/(supervisor)/(tabs)/inbox';
      }
      return '/(agent)/support-ticket';
    case NOTIFICATION_TYPES.syncFailure:
      return '/(agent)/(tabs)';
    case NOTIFICATION_TYPES.reportReminder:
      return '/(agent)/(tabs)/reports';
    case NOTIFICATION_TYPES.noShow:
    case NOTIFICATION_TYPES.flaggedReport:
    case NOTIFICATION_TYPES.dailyDigest:
      return isSupervisor ? '/(supervisor)/(tabs)/inbox' : '/(agent)/(tabs)';
    default:
      return isSupervisor ? '/(supervisor)/(tabs)/inbox' : '/(agent)/support-ticket';
  }
}
