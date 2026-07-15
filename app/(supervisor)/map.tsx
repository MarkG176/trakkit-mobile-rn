import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { AppText, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

interface AgentLocation {
  agent_id: string;
  location_lat: number;
  location_lng: number;
  status: string;
}

export default function MapScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [locations, setLocations] = useState<AgentLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspaceId) return;

    const load = async () => {
      const { data } = await supabase
        .from('agent_status_log')
        .select('agent_id, location_lat, location_lng, status, timestamp')
        .eq('workspace_id', currentWorkspaceId)
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(50);

      const byAgent = new Map<string, AgentLocation>();
      (data ?? []).forEach((row) => {
        if (!byAgent.has(row.agent_id) && row.location_lat != null && row.location_lng != null) {
          byAgent.set(row.agent_id, {
            agent_id: row.agent_id,
            location_lat: row.location_lat,
            location_lng: row.location_lng,
            status: row.status,
          });
        }
      });
      setLocations(Array.from(byAgent.values()));
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`supervisor-map-${currentWorkspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_status_log',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        (payload) => {
          const row = payload.new as {
            agent_id: string;
            location_lat?: number | null;
            location_lng?: number | null;
            status: string;
          };
          if (row.location_lat != null && row.location_lng != null) {
            setLocations((prev) => {
              const filtered = prev.filter((l) => l.agent_id !== row.agent_id);
              return [
                {
                  agent_id: row.agent_id,
                  location_lat: row.location_lat!,
                  location_lng: row.location_lng!,
                  status: row.status,
                },
                ...filtered,
              ];
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId]);

  const initialRegion = locations[0]
    ? {
        latitude: locations[0].location_lat,
        longitude: locations[0].location_lng,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }
    : { latitude: -1.2921, longitude: 36.8219, latitudeDelta: 0.5, longitudeDelta: 0.5 };

  return (
    <ComponentGate code="CRM-0125">
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <MapView style={{ flex: 1 }} initialRegion={initialRegion}>
            {locations.map((loc) => (
              <Marker
                key={loc.agent_id}
                coordinate={{ latitude: loc.location_lat, longitude: loc.location_lng }}
                title={loc.agent_id}
                description={loc.status}
              />
            ))}
          </MapView>
        )}
        <View style={{ position: 'absolute', bottom: spacing.lg, left: spacing.lg }}>
          <Card style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, opacity: 0.95 }}>
            <AppText style={{ fontWeight: '500' }}>{locations.length} agents on map</AppText>
          </Card>
        </View>
      </View>
    </ComponentGate>
  );
}
