import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export const BACKGROUND_LOCATION_TASK = 'trakkit-background-location';
const WORKSPACE_STORAGE_KEY = 'trakkit_current_workspace_id';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  const locations = (data as { locations?: Location.LocationObject[] })?.locations;
  if (!locations?.length) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const workspaceId = await AsyncStorage.getItem(WORKSPACE_STORAGE_KEY);
  const latest = locations[locations.length - 1];
  await supabase.from('agent_status_log').insert({
    agent_id: user.id,
    workspace_id: workspaceId,
    status: 'location_ping',
    location_lat: latest.coords.latitude,
    location_lng: latest.coords.longitude,
    timestamp: new Date().toISOString(),
  });
});

export async function startBackgroundTracking(): Promise<boolean> {
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') return false;

  const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (started) return true;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 5 * 60 * 1000,
    distanceInterval: 50,
    foregroundService: {
      notificationTitle: 'TraKKiT',
      notificationBody: 'Tracking your location during your shift',
    },
  });
  return true;
}

export async function stopBackgroundTracking(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (started) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}
