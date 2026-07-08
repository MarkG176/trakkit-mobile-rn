export interface Coordinates {
  latitude: number;
  longitude: number;
}

const roundCoordinate = (coord: number, decimals = 3): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(coord * factor) / factor;
};

export const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

export const isValidCoordinate = (value: number): boolean =>
  !isNaN(value) && isFinite(value);

export const isValidLatitude = (lat: number): boolean =>
  isValidCoordinate(lat) && lat >= -90 && lat <= 90;

export const isValidLongitude = (lon: number): boolean =>
  isValidCoordinate(lon) && lon >= -180 && lon <= 180;

const calculateDistanceFallback = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const latDiff = Math.abs(lat2 - lat1);
  const lonDiff = Math.abs(lon2 - lon1);
  const avgLat = (lat1 + lat2) / 2;
  const latDistance = latDiff * 111000;
  const lonDistance = lonDiff * 111000 * Math.cos(toRadians(avgLat));
  return Math.sqrt(latDistance * latDistance + lonDistance * lonDistance);
};

export const calculateDistance = async (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): Promise<number> => {
  if (
    !isValidCoordinate(lat1) ||
    !isValidCoordinate(lon1) ||
    !isValidCoordinate(lat2) ||
    !isValidCoordinate(lon2)
  ) {
    throw new Error('Invalid coordinates provided');
  }

  return calculateDistanceFallback(
    roundCoordinate(lat1),
    roundCoordinate(lon1),
    roundCoordinate(lat2),
    roundCoordinate(lon2),
  );
};

export const calculateDistanceBetween = async (
  point1: Coordinates,
  point2: Coordinates,
): Promise<number> =>
  calculateDistance(
    point1.latitude,
    point1.longitude,
    point2.latitude,
    point2.longitude,
  );

export const formatDistance = (distanceInMeters: number): string => {
  if (distanceInMeters < 1000) return `${Math.round(distanceInMeters)}m`;
  if (distanceInMeters < 10000) return `${(distanceInMeters / 1000).toFixed(1)}km`;
  return `${Math.round(distanceInMeters / 1000)}km`;
};

export const isWithinDistance = async (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  thresholdMeters: number,
): Promise<boolean> => {
  const distance = await calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= thresholdMeters;
};
