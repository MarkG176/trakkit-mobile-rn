import { ReactNode, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/providers/AuthProvider';
import { useUserRole } from '@/hooks/useUserRole';
import { routeForNotificationType } from '@/constants/notifications';
import {
  configureNotificationHandler,
  getPushData,
  registerForPushNotifications,
  type PushNotificationData,
} from '@/services/pushNotifications';
import { useEodReportReminder } from '@/hooks/useEodReportReminder';

configureNotificationHandler();

function routeForPush(data: PushNotificationData | null, isSupervisor: boolean): string {
  return routeForNotificationType(
    typeof data?.type === 'string' ? data.type : undefined,
    isSupervisor,
    typeof data?.kind === 'string' ? data.kind : undefined,
  );
}

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isSupervisor, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const handledResponseId = useRef<string | null>(null);

  useEodReportReminder();

  useEffect(() => {
    if (!user?.id) return;
    void registerForPushNotifications(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (roleLoading) return;

    const navigateFromData = (data: PushNotificationData | null) => {
      router.push(routeForPush(data, isSupervisor) as never);
    };

    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const responseId = response.notification.request.identifier;
      if (handledResponseId.current === responseId) return;
      handledResponseId.current = responseId;
      navigateFromData(getPushData(response));
    };

    void Notifications.getLastNotificationResponseAsync().then(handleResponse);

    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, [isSupervisor, roleLoading, router]);

  return <>{children}</>;
}
