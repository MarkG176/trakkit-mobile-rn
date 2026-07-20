// [CRM-0125] Supervisor Map — latest agent locations with detail modal
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { MapPin, X } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { DateRangeChips } from '@/components/supervisor/DateRangeChips';
import { AppText, Badge, Card, LoadingSpinner } from '@/components/ui';
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { colors, hitSlop, radius, spacing } from '@/theme';

const DEFAULT_REGION: Region = {
  latitude: -1.2921,
  longitude: 36.8219,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

interface AgentLocation {
  agent_id: string;
  agent_display_name: string | null;
  status: string;
  timestamp: string;
  location_lat: number;
  location_lng: number;
  selfie_url: string | null;
}

export default function MapScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const params = useLocalSearchParams<{ lat?: string; lng?: string; agentId?: string }>();
  const { preset, setPreset, startISO, endISO } = useDateRangeFilter('today');
  const [selected, setSelected] = useState<AgentLocation | null>(null);
  const mapRef = useRef<MapView>(null);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['supervisor-map', currentWorkspaceId, startISO, endISO],
    enabled: Boolean(currentWorkspaceId),
    queryFn: async (): Promise<AgentLocation[]> => {
      if (!currentWorkspaceId) return [];

      let query = supabase
        .from('agent_status_log')
        .select(
          'agent_id, agent_display_name, status, timestamp, location_lat, location_lng, selfie_url',
        )
        .eq('workspace_id', currentWorkspaceId)
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (startISO) query = query.gte('timestamp', startISO);
      if (endISO) query = query.lte('timestamp', endISO);

      const { data, error } = await query;
      if (error) throw error;

      const seen = new Set<string>();
      return ((data || []) as AgentLocation[]).filter((loc) => {
        if (seen.has(loc.agent_id)) return false;
        seen.add(loc.agent_id);
        return loc.location_lat != null && loc.location_lng != null;
      });
    },
  });

  const initialRegion = useMemo((): Region => {
    const paramLat = params.lat ? Number(params.lat) : NaN;
    const paramLng = params.lng ? Number(params.lng) : NaN;
    if (Number.isFinite(paramLat) && Number.isFinite(paramLng)) {
      return {
        latitude: paramLat,
        longitude: paramLng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    if (locations.length === 0) return DEFAULT_REGION;
    const avgLat =
      locations.reduce((s, l) => s + l.location_lat, 0) / locations.length;
    const avgLng =
      locations.reduce((s, l) => s + l.location_lng, 0) / locations.length;
    return {
      latitude: avgLat,
      longitude: avgLng,
      latitudeDelta: 0.15,
      longitudeDelta: 0.15,
    };
  }, [locations, params.lat, params.lng]);

  useEffect(() => {
    if (params.agentId && locations.length > 0) {
      const match = locations.find((l) => l.agent_id === params.agentId);
      if (match) setSelected(match);
    }
  }, [params.agentId, locations]);

  useEffect(() => {
    if (mapRef.current && locations.length > 0) {
      mapRef.current.animateToRegion(initialRegion, 400);
    }
  }, [initialRegion, locations.length]);

  const onMarkerPress = useCallback((loc: AgentLocation) => {
    setSelected(loc);
  }, []);

  return (
    <ComponentGate code="CRM-0125">
      <View style={styles.root}>
        <View style={styles.filters}>
          <View style={styles.header}>
            <MapPin size={18} color={colors.primary} />
            <AppText style={styles.headerTitle}>Agent Map</AppText>
            <Badge variant="secondary">{String(locations.length)}</Badge>
          </View>
          <DateRangeChips preset={preset} onChange={setPreset} />
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <LoadingSpinner label="Loading map" />
          </View>
        ) : (
          <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
            {locations.map((loc) => (
              <Marker
                key={loc.agent_id}
                coordinate={{
                  latitude: loc.location_lat,
                  longitude: loc.location_lng,
                }}
                title={loc.agent_display_name || 'Agent'}
                description={loc.status}
                onPress={() => onMarkerPress(loc)}
              />
            ))}
          </MapView>
        )}

        <View style={styles.floating}>
          <Card style={styles.countCard}>
            <AppText style={styles.countText}>
              {locations.length} agent{locations.length === 1 ? '' : 's'} on map
            </AppText>
          </Card>
        </View>

        <Modal
          visible={!!selected}
          animationType="slide"
          transparent
          onRequestClose={() => setSelected(null)}
        >
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <AppText variant="h3">
                  {selected?.agent_display_name || 'Agent'}
                </AppText>
                <Pressable onPress={() => setSelected(null)} hitSlop={hitSlop}>
                  <X size={22} color={colors.mutedForeground} />
                </Pressable>
              </View>
              {selected ? (
                <View style={styles.sheetBody}>
                  <Badge
                    variant={
                      selected.status === 'checked_in'
                        ? 'success'
                        : selected.status === 'lunch'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {selected.status.replace(/_/g, ' ')}
                  </Badge>
                  <AppText variant="secondary">
                    {format(new Date(selected.timestamp), 'MMM d, yyyy · HH:mm')}
                  </AppText>
                  <AppText variant="secondary">
                    {selected.location_lat.toFixed(5)}, {selected.location_lng.toFixed(5)}
                  </AppText>
                  {selected.selfie_url ? (
                    <Image
                      source={{ uri: selected.selfie_url }}
                      style={styles.selfie}
                    />
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        </Modal>
      </View>
    </ComponentGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  filters: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerTitle: { flex: 1, fontWeight: '600', fontSize: 16 },
  map: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  floating: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
  },
  countCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    opacity: 0.95,
  },
  countText: { fontWeight: '500' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    minHeight: '35%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetBody: { gap: spacing.md },
  selfie: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
});
