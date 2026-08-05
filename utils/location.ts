import * as Location from 'expo-location';

export interface CurrentLocation {
  latitude: number;
  longitude: number;
}

export async function requestForegroundLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
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

export interface ReverseGeocodeResult {
  county: string;
  country: string;
}

/** Map GPS coords to county (admin area) and country via Expo reverse geocode. */
export async function reverseGeocodeCountyCountry(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  const results = await Location.reverseGeocodeAsync({ latitude, longitude });
  const place = results[0];
  if (!place) {
    throw new Error('Could not determine county or country from location');
  }

  const county = (place.region || place.subregion || place.city || '').trim();
  const country = (place.country || place.isoCountryCode || '').trim();

  if (!county || !country) {
    throw new Error('Could not determine county or country from location');
  }

  return { county, country };
}
