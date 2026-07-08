import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { getCurrentLocation } from '@/utils/location';
import { formatDistance, calculateDistanceBetween } from '@/utils/distanceCalculator';
import { PermissionGuidance } from '@/components/PermissionGuidance';

interface GeoCaptureProps {
  targetLat?: number;
  targetLon?: number;
  onLocation: (lat: number, lon: number) => void;
}

export function GeoCapture({ targetLat, targetLon, onLocation }: GeoCaptureProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);

  const capture = async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      onLocation(loc.latitude, loc.longitude);

      if (targetLat != null && targetLon != null) {
        const meters = await calculateDistanceBetween(
          { latitude: loc.latitude, longitude: loc.longitude },
          { latitude: targetLat, longitude: targetLon },
        );
        setDistance(formatDistance(meters));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Location unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    capture();
  }, []);

  if (loading) {
    return (
      <View className="mb-4 flex-row items-center gap-2 rounded-xl bg-slate-50 p-3">
        <ActivityIndicator size="small" color="#2563eb" />
        <Text className="text-sm text-slate-600">Capturing location...</Text>
      </View>
    );
  }

  if (error?.includes('denied')) {
    return <PermissionGuidance type="location" onRetry={capture} />;
  }

  if (error) {
    return (
      <View className="mb-4 rounded-xl bg-red-50 p-3">
        <Text className="text-sm text-red-700">{error}</Text>
      </View>
    );
  }

  return (
    <View className="mb-4 rounded-xl bg-green-50 p-3">
      <Text className="text-sm text-green-800">Location captured{distance ? ` — ${distance} from target` : ''}</Text>
    </View>
  );
}
