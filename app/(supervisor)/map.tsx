import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';

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
      <View className="flex-1">
        {loading ? (
          <ActivityIndicator className="flex-1" color="#2563eb" />
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
        <View className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-3 py-2">
          <Text className="text-sm font-medium text-slate-800">{locations.length} agents on map</Text>
        </View>
      </View>
    </ComponentGate>
  );
}
