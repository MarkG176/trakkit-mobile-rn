import * as Location from 'expo-location';

export interface CurrentLocation {
  latitude: number;
  longitude: number;
}

export async function requestForegroundLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function requestBackgroundLocationPermission(): Promise<boolean> {
  const foreground = await requestForegroundLocationPermission();
  if (!foreground) return false;
  const { status } = await Location.requestBackgroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation(): Promise<CurrentLocation> {
  const granted = await requestForegroundLocationPermission();
  if (!granted) throw new Error('Location permission denied');

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}
