import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export type PermissionType = 'camera' | 'location' | 'storage' | 'microphone' | 'notification';
export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface PermissionState {
  status: PermissionStatus;
  requestedAt?: number;
  deniedAt?: number;
  dismissed?: boolean;
  dismissedUntil?: number;
}

export type PermissionStateMap = Record<PermissionType, PermissionState>;

const STORAGE_KEY_PREFIX = 'permission_';

function mapExpoStatus(status: string): PermissionStatus {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  if (status === 'undetermined') return 'prompt';
  return 'unknown';
}

export async function getPermissionStatus(type: PermissionType): Promise<PermissionStatus> {
  const cached = await loadPermissionStateFromStorage(type);
  if (cached?.status && cached.status !== 'prompt') {
    return cached.status;
  }

  try {
    switch (type) {
      case 'camera': {
        const { status } = await ImagePicker.getCameraPermissionsAsync();
        return mapExpoStatus(status);
      }
      case 'location': {
        const { status } = await Location.getForegroundPermissionsAsync();
        return mapExpoStatus(status);
      }
      case 'storage':
        return 'granted';
      case 'microphone':
      case 'notification':
        return cached?.status ?? 'prompt';
      default:
        return 'unknown';
    }
  } catch (error) {
    console.error(`Error checking ${type} permission:`, error);
    return 'unknown';
  }
}

export async function getAllPermissionStatuses(): Promise<PermissionStateMap> {
  const types: PermissionType[] = ['camera', 'location', 'storage', 'microphone', 'notification'];
  const result = {} as PermissionStateMap;

  for (const type of types) {
    const status = await getPermissionStatus(type);
    result[type] = { status };
  }

  return result;
}

export async function requestPermission(type: PermissionType): Promise<boolean> {
  try {
    switch (type) {
      case 'camera': {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        const mapped = mapExpoStatus(status);
        savePermissionState(type, mapped);
        return mapped === 'granted';
      }
      case 'location': {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const mapped = mapExpoStatus(status);
        savePermissionState(type, mapped);
        return mapped === 'granted';
      }
      case 'storage':
        savePermissionState(type, 'granted');
        return true;
      case 'microphone':
      case 'notification':
        return false;
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error requesting ${type} permission:`, error);
    return false;
  }
}

export async function requestAllPermissions(): Promise<Record<PermissionType, boolean>> {
  const types: PermissionType[] = ['camera', 'location', 'storage'];
  const results = {} as Record<PermissionType, boolean>;

  for (const type of types) {
    results[type] = await requestPermission(type);
  }

  results.microphone = false;
  results.notification = false;
  return results;
}

export async function loadPermissionStateFromStorage(type: PermissionType): Promise<PermissionState | null> {
  try {
    const stored = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${type}`);
    return stored ? (JSON.parse(stored) as PermissionState) : null;
  } catch {
    return null;
  }
}

export async function savePermissionState(type: PermissionType, status: PermissionStatus): Promise<void> {
  try {
    const state: PermissionState = {
      status,
      requestedAt: Date.now(),
      ...(status === 'denied' ? { deniedAt: Date.now() } : {}),
    };
    await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${type}`, JSON.stringify(state));
  } catch (error) {
    console.error(`Error saving permission state for ${type}:`, error);
  }
}

export async function dismissPermissionPrompt(type: PermissionType, hours = 24): Promise<void> {
  try {
    const stored = (await loadPermissionStateFromStorage(type)) ?? { status: 'prompt' as PermissionStatus };
    const state: PermissionState = {
      ...stored,
      dismissed: true,
      dismissedUntil: Date.now() + hours * 60 * 60 * 1000,
    };
    await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${type}`, JSON.stringify(state));
  } catch (error) {
    console.error(`Error dismissing permission prompt for ${type}:`, error);
  }
}

export async function clearPermissionDismissal(type: PermissionType): Promise<void> {
  try {
    const stored = (await loadPermissionStateFromStorage(type)) ?? { status: 'prompt' as PermissionStatus };
    const state: PermissionState = { ...stored, dismissed: false, dismissedUntil: undefined };
    await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${type}`, JSON.stringify(state));
  } catch (error) {
    console.error(`Error clearing dismissal for ${type}:`, error);
  }
}

export async function isPermissionDismissed(type: PermissionType): Promise<boolean> {
  try {
    const state = await loadPermissionStateFromStorage(type);
    if (!state?.dismissed) return false;
    if (state.dismissedUntil && Date.now() > state.dismissedUntil) {
      await clearPermissionDismissal(type);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
