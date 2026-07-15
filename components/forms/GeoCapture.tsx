import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getCurrentLocation } from '@/utils/location';
import { formatDistance, calculateDistanceBetween } from '@/utils/distanceCalculator';
import { PermissionGuidance } from '@/components/PermissionGuidance';
import { AppText, Badge } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: colors.muted,
          padding: spacing.md,
        }}
      >
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText variant="secondary">Capturing location...</AppText>
      </View>
    );
  }

  if (error?.includes('denied')) {
    return <PermissionGuidance type="location" onRetry={capture} />;
  }

  if (error) {
    return (
      <View style={{ marginBottom: spacing.lg }}>
        <Badge variant="destructive">{error}</Badge>
      </View>
    );
  }

  return (
    <View
      style={{
        marginBottom: spacing.lg,
        borderRadius: radius.lg,
        backgroundColor: colors.primaryLight,
        padding: spacing.md,
      }}
    >
      <AppText style={{ color: colors.primary }}>
        Location captured{distance ? ` — ${distance} from target` : ''}
      </AppText>
    </View>
  );
}
