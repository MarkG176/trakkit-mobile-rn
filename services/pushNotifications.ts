import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';

const ANDROID_CHANNEL_ID = 'default';

/** Last registered Expo push token for this app session (used on sign-out cleanup). */
let currentPushToken: string | null = null;

export type PushNotificationData = {
  type?: string;
  id?: string;
  status?: string;
  [key: string]: unknown;
};

export function getEasProjectId(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  if (fromEnv) return fromEnv;

  const fromExtra = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (fromExtra?.trim()) return fromExtra.trim();

  const fromEasConfig = Constants.easConfig?.projectId;
  if (fromEasConfig?.trim()) return fromEasConfig.trim();

  return undefined;
}

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#00A3AD',
  });
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[push] Push notifications require a physical device');
    return null;
  }

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('[push] Notification permission not granted');
    return null;
  }

  const projectId = getEasProjectId();
  if (!projectId) {
    console.warn(
      '[push] Missing EAS projectId. Set EXPO_PUBLIC_EAS_PROJECT_ID or app.json extra.eas.projectId (run eas init).',
    );
    return null;
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenResult.data;
  if (!token) return null;

  const deviceInfo = {
    brand: Device.brand,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    deviceName: Device.deviceName,
  };

  const { error } = await supabase.from('device_push_tokens').upsert(
    {
      agent_id: userId,
      expo_push_token: token,
      platform: Platform.OS,
      device_info: deviceInfo,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'agent_id,expo_push_token' },
  );

  if (error) {
    console.error('[push] Failed to upsert device token', error);
    return null;
  }

  currentPushToken = token;
  return token;
}

export async function unregisterPushToken(token: string | null | undefined): Promise<void> {
  if (!token) return;
  const { error } = await supabase.from('device_push_tokens').delete().eq('expo_push_token', token);
  if (error) {
    console.error('[push] Failed to delete device token', error);
  }
  if (currentPushToken === token) {
    currentPushToken = null;
  }
}

/** Delete this device's token while the session is still valid (call before auth.signOut). */
export async function unregisterCurrentPushToken(): Promise<void> {
  await unregisterPushToken(currentPushToken);
}

export function getPushData(
  response: Notifications.NotificationResponse | null | undefined,
): PushNotificationData | null {
  const data = response?.notification?.request?.content?.data;
  if (!data || typeof data !== 'object') return null;
  return data as PushNotificationData;
}
