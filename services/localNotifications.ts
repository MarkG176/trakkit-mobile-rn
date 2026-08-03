import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NOTIFICATION_TYPES } from '@/constants/notifications';

const EOD_IDENTIFIER = 'trakkit-eod-report-reminder';
/** Default local nudge near end of shift (Africa/Nairobi wall clock approximated via device local time). */
const EOD_HOUR = 17;
const EOD_MINUTE = 0;

/** Stuck in outbox longer than this → interrupt the agent. */
export const SYNC_STALE_MS = 15 * 60 * 1000;
const SYNC_FAIL_IDENTIFIER_PREFIX = 'trakkit-sync-failure-';

export async function presentSyncFailureNotification(pendingCount: number): Promise<void> {
  if (pendingCount <= 0) return;

  await Notifications.scheduleNotificationAsync({
    identifier: `${SYNC_FAIL_IDENTIFIER_PREFIX}${Date.now()}`,
    content: {
      title: 'Submission failed to sync',
      body:
        pendingCount === 1
          ? '1 field submission is still waiting to sync. Open TraKKiT to retry.'
          : `${pendingCount} field submissions are still waiting to sync. Open TraKKiT to retry.`,
      data: { type: NOTIFICATION_TYPES.syncFailure },
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'default' } : null),
    },
    trigger: null,
  });
}

/** Schedule a single daily report reminder; replaces any prior schedule. */
export async function scheduleEodReportReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(EOD_IDENTIFIER).catch(() => undefined);

  await Notifications.scheduleNotificationAsync({
    identifier: EOD_IDENTIFIER,
    content: {
      title: 'Evening report not submitted',
      body: 'Submit your end-of-day report before you wrap up.',
      data: { type: NOTIFICATION_TYPES.reportReminder },
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'default' } : null),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: EOD_HOUR,
      minute: EOD_MINUTE,
    },
  });
}

export async function cancelEodReportReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(EOD_IDENTIFIER).catch(() => undefined);
}
