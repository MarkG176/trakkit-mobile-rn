import { isValidLatitude, isValidLongitude } from './distanceCalculator';

export const DEFAULT_CHECK_IN_RADIUS_METERS = 200;

export interface LocationValidationResult {
  valid: boolean;
  distanceMeters?: number;
  message?: string;
}

export function validateCoordinates(lat: number, lon: number): LocationValidationResult {
  if (!isValidLatitude(lat)) {
    return { valid: false, message: 'Invalid latitude' };
  }
  if (!isValidLongitude(lon)) {
    return { valid: false, message: 'Invalid longitude' };
  }
  return { valid: true };
}

export async function validateCheckInDistance(
  agentLat: number,
  agentLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters = DEFAULT_CHECK_IN_RADIUS_METERS,
): Promise<LocationValidationResult> {
  const coordCheck = validateCoordinates(agentLat, agentLon);
  if (!coordCheck.valid) return coordCheck;

  const targetCheck = validateCoordinates(targetLat, targetLon);
  if (!targetCheck.valid) return targetCheck;

  const { calculateDistance } = await import('./distanceCalculator');
  const distance = await calculateDistance(agentLat, agentLon, targetLat, targetLon);

  if (distance > radiusMeters) {
    return {
      valid: false,
      distanceMeters: distance,
      message: `You are ${Math.round(distance)}m away. Must be within ${radiusMeters}m.`,
    };
  }

  return { valid: true, distanceMeters: distance };
}
