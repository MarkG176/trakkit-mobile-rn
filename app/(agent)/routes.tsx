// [CRM-0098] Routes — search stores & set assigned location (no GPS required)
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  View,
} from 'react-native';
import { MapPin, Search } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { workspaceService } from '@/services/workspaceService';
import { fuzzyMatch } from '@/utils/fuzzyMatch';
import {
  AppText,
  Button,
  EmptyMessage,
  Input,
  LoadingSpinner,
  Screen,
} from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';

interface Store {
  id: string;
  store_name: string;
  county: string | null;
  country?: string | null;
  store_lat: number | null;
  store_long: number | null;
  contact?: string | null;
}

export default function RoutesScreen() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStores = useCallback(async () => {
    if (!currentWorkspaceId) {
      setStores([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [{ data, error }, { data: activeProject }] = await Promise.all([
        supabase
          .from('stores')
          .select('id, store_name, county, country, store_lat, store_long, contact')
          .eq('workspace_id', currentWorkspaceId)
          .or('is_deleted.eq.false,is_deleted.is.null'),
        supabase
          .from('project_plans')
          .select('id, target_stores')
          .eq('workspace_id', currentWorkspaceId)
          .eq('status', 'active')
          .or('is_deleted.eq.false,is_deleted.is.null')
          .limit(1)
          .maybeSingle(),
      ]);

      if (error) throw error;

      let merged: Store[] = data ?? [];
      const rawTargets = (activeProject as { target_stores?: unknown } | null)?.target_stores;
      const targetIds: string[] = Array.isArray(rawTargets)
        ? rawTargets.filter((v): v is string => typeof v === 'string')
        : [];

      if (targetIds.length > 0) {
        const existing = new Set(merged.map((s) => s.id));
        const missing = targetIds.filter((id) => !existing.has(id));
        if (missing.length > 0) {
          const { data: extra } = await supabase
            .from('stores')
            .select('id, store_name, county, country, store_lat, store_long, contact')
            .in('id', missing)
            .or('is_deleted.eq.false,is_deleted.is.null');
          if (extra?.length) merged = [...merged, ...extra];
        }
      }

      const dedup = Array.from(new Map(merged.map((s) => [s.id, s])).values()).sort((a, b) =>
        a.store_name.localeCompare(b.store_name),
      );
      setStores(dedup);
    } catch (err) {
      console.error('Error fetching stores', err);
      Alert.alert('Error', 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    void fetchStores();
  }, [fetchStores]);

  const filtered = useMemo(
    () =>
      stores.filter((s) =>
        fuzzyMatch(`${s.store_name} ${s.county ?? ''} ${s.country ?? ''}`, search),
      ),
    [stores, search],
  );

  const confirmLocation = async () => {
    if (!user || !currentWorkspaceId || !selectedId) {
      Alert.alert('Select a store', 'Please select a store to set as your location.');
      return;
    }
    const store = stores.find((s) => s.id === selectedId);
    if (!store) {
      Alert.alert('Store not found');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('agent_status_log').insert({
        agent_id: user.id,
        status: 'set_location',
        assigned_location_lat: store.store_lat,
        assigned_location_lng: store.store_long,
        workspace_id: currentWorkspaceId,
        store_id: store.id,
      });
      if (error) throw error;

      await supabase.from('agent_actions').insert(
        workspaceService.ensureWorkspaceContext({
          agent_id: user.id,
          action_type: 'location_set',
          points_earned: 10,
          action_data: {
            store_name: store.store_name,
            store_coordinates: {
              lat: store.store_lat,
              lng: store.store_long,
            },
            timestamp: new Date().toISOString(),
          },
          location_lat: store.store_lat,
          location_lng: store.store_long,
          performed_at: new Date().toISOString(),
        }),
      );

      Alert.alert('Location set', `Your assigned location is ${store.store_name}.`);
      setSelectedId(null);
      setSearch('');
    } catch (err: any) {
      console.error('Error setting location', err);
      Alert.alert('Error', err?.message || 'Failed to set location');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ComponentGate code="CRM-0098" redirectTo="/(agent)">
      <Screen>
        <AppText style={{ fontWeight: '700', fontSize: 18, marginBottom: spacing.sm }}>
          Set assigned location
        </AppText>
        <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
          Search and confirm a store. GPS is not required.
        </AppText>

        <View style={{ marginBottom: spacing.md, position: 'relative' }}>
          <Input
            label="Search stores"
            value={search}
            onChangeText={setSearch}
            placeholder="Store name, county…"
            autoCorrect={false}
          />
          <View style={{ position: 'absolute', right: spacing.md, top: 42 }}>
            <Search size={18} color={colors.mutedForeground} />
          </View>
        </View>

        {loading ? (
          <LoadingSpinner label="Loading stores" />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            ListEmptyComponent={<EmptyMessage>No stores match your search.</EmptyMessage>}
            renderItem={({ item }) => {
              const selected = selectedId === item.id;
              return (
                <Pressable
                  onPress={() => setSelectedId(item.id)}
                  hitSlop={hitSlop}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    minHeight: 56,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                    borderRadius: radius.md,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primaryLight : colors.card,
                  }}
                >
                  <MapPin size={20} color={selected ? colors.primary : colors.mutedForeground} />
                  <View style={{ flex: 1 }}>
                    <AppText style={{ fontWeight: '600' }}>{item.store_name}</AppText>
                    {item.county ? (
                      <AppText variant="secondary" style={{ fontSize: 12, marginTop: 2 }}>
                        {item.county}
                        {item.country ? ` · ${item.country}` : ''}
                      </AppText>
                    ) : null}
                  </View>
                </Pressable>
              );
            }}
            contentContainerStyle={{ paddingBottom: spacing.lg }}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Button
          onPress={confirmLocation}
          loading={submitting}
          disabled={!selectedId || submitting}
          style={{ marginTop: spacing.sm }}
        >
          Confirm location
        </Button>
      </Screen>
    </ComponentGate>
  );
}
