import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Card, IconChip, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import type { WorkspaceStore } from '@/hooks/useWorkspaceStores';
import { getCurrentLocation, type CurrentLocation } from '@/utils/location';
import { colors, hitSlop, radius, spacing } from '@/theme';

type SetAssignedLocationCardProps = {
  stores: WorkspaceStore[];
  storesLoading: boolean;
};

export function SetAssignedLocationCard({ stores, storesLoading }: SetAssignedLocationCardProps) {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();

  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const requestLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const loc = await getCurrentLocation();
      setCurrentLocation(loc);
    } catch (error) {
      setCurrentLocation(null);
      setLocationError(error instanceof Error ? error.message : 'Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    void requestLocation();
  }, [requestLocation]);

  const filteredStores = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter((s) => s.store_name.toLowerCase().includes(q));
  }, [stores, searchText]);

  const selectedStore = selectedStoreId
    ? stores.find((s) => s.id === selectedStoreId) ?? null
    : null;

  const handleSelect = (store: WorkspaceStore) => {
    setSelectedStoreId(store.id);
    setSearchText(store.store_name);
    setListOpen(false);
  };

  const handleSubmit = async () => {
    if (!user || !currentWorkspaceId) {
      Alert.alert('Workspace required', 'Please select a workspace first.');
      return;
    }
    if (!selectedStore) {
      Alert.alert('Select a store', 'Please select a specific store to set as your location.');
      return;
    }

    setSubmitting(true);
    try {
      await writeWithOfflineQueue('agent_status_log', {
        agent_id: user.id,
        workspace_id: currentWorkspaceId,
        status: 'set_location',
        assigned_location_lat: selectedStore.store_lat,
        assigned_location_lng: selectedStore.store_long,
        store_id: selectedStore.id,
        timestamp: new Date().toISOString(),
      });

      Alert.alert('Location set', `Your assigned location is ${selectedStore.store_name}.`);
      setSelectedStoreId(null);
      setSearchText('');
    } catch (error) {
      Alert.alert(
        'Error setting location',
        error instanceof Error ? error.message : 'Failed to set your location. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <IconChip
          name="location-outline"
          backgroundColor={colors.primaryLight}
          color={colors.primary}
        />
        <AppText style={{ fontWeight: '600', fontSize: 16, flex: 1, flexShrink: 1 }}>
          Set Your Assigned Location
        </AppText>
      </View>

      <View
        style={{
          backgroundColor: colors.muted,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <AppText style={{ fontWeight: '600', fontSize: 14, marginBottom: spacing.xs }}>
          Current Location
        </AppText>
        {locationLoading ? (
          <LoadingSpinner label="Getting your location…" />
        ) : locationError ? (
          <View style={{ gap: spacing.sm }}>
            <AppText style={{ color: colors.destructive, fontSize: 13 }}>{locationError}</AppText>
            <Button variant="outline" size="sm" onPress={() => void requestLocation()}>
              Retry
            </Button>
          </View>
        ) : currentLocation ? (
          <View style={{ gap: 2 }}>
            <AppText variant="secondary" style={{ fontSize: 13 }}>
              Latitude: {currentLocation.latitude.toFixed(6)}
            </AppText>
            <AppText variant="secondary" style={{ fontSize: 13 }}>
              Longitude: {currentLocation.longitude.toFixed(6)}
            </AppText>
          </View>
        ) : (
          <AppText variant="secondary" style={{ fontSize: 13 }}>
            Location unavailable
          </AppText>
        )}
      </View>

      <AppText style={{ fontWeight: '500', fontSize: 14, marginBottom: spacing.xs }}>Store</AppText>
      <View style={{ position: 'relative', zIndex: 10, marginBottom: spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            backgroundColor: colors.card,
            paddingHorizontal: spacing.md,
            minHeight: 48,
          }}
        >
          <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
          <TextInput
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              setSelectedStoreId(null);
              setListOpen(true);
            }}
            onFocus={() => setListOpen(true)}
            placeholder="Search stores…"
            placeholderTextColor={colors.mutedForeground}
            style={{
              flex: 1,
              marginLeft: spacing.sm,
              fontSize: 16,
              color: colors.foreground,
              paddingVertical: spacing.sm,
            }}
          />
          {searchText ? (
            <Pressable
              onPress={() => {
                setSearchText('');
                setSelectedStoreId(null);
                setListOpen(false);
              }}
              hitSlop={hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        {listOpen ? (
          <View
            style={{
              marginTop: spacing.xs,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.md,
              backgroundColor: colors.card,
              maxHeight: 220,
              overflow: 'hidden',
            }}
          >
            {storesLoading ? (
              <View style={{ padding: spacing.md }}>
                <LoadingSpinner label="Loading stores…" />
              </View>
            ) : filteredStores.length === 0 ? (
              <AppText
                variant="secondary"
                style={{ padding: spacing.md, fontSize: 14 }}
              >
                No stores found
              </AppText>
            ) : (
              filteredStores.slice(0, 40).map((store) => (
                <Pressable
                  key={store.id}
                  onPress={() => handleSelect(store)}
                  hitSlop={hitSlop}
                  style={({ pressed }) => ({
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.md,
                    minHeight: 48,
                    justifyContent: 'center',
                    backgroundColor: pressed ? colors.muted : 'transparent',
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  })}
                >
                  <AppText style={{ fontWeight: '500', fontSize: 16 }}>{store.store_name}</AppText>
                  {store.county ? (
                    <AppText variant="secondary" style={{ fontSize: 13, marginTop: 2 }}>
                      {store.county}
                    </AppText>
                  ) : null}
                </Pressable>
              ))
            )}
          </View>
        ) : null}
      </View>

      <Button
        onPress={() => void handleSubmit()}
        loading={submitting}
        disabled={!selectedStore || submitting}
      >
        {submitting ? 'Setting Location…' : 'Submit Location'}
      </Button>
    </Card>
  );
}
