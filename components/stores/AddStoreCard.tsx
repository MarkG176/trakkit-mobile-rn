import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Button, Card, IconChip, appAlert } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import {
  getCurrentLocation,
  reverseGeocodeCountyCountry,
  type CurrentLocation,
} from '@/utils/location';
import { colors, spacing } from '@/theme';

type AddedStorePayload = {
  id: string;
  name: string;
  county: string;
};

type AddStoreCardProps = {
  onStoreAdded?: () => void | Promise<void>;
  onSuccess?: (store: AddedStorePayload) => void;
};

export function AddStoreCard({ onStoreAdded, onSuccess }: AddStoreCardProps) {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();

  const [expanded, setExpanded] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleExpand = async () => {
    setExpanded(true);
  };

  const handleCancel = () => {
    setExpanded(false);
    setStoreName('');
    setContact('');
  };

  const handleAdd = async () => {
    if (!storeName.trim()) {
      Alert.alert('Missing information', 'Please enter a store name.');
      return;
    }
    if (!user || !currentWorkspaceId) {
      Alert.alert('Workspace required', 'No workspace selected. Please select a workspace first.');
      return;
    }

    setSubmitting(true);
    try {
      setLocationLoading(true);
      let location: CurrentLocation;
      try {
        location = await getCurrentLocation();
      } finally {
        setLocationLoading(false);
      }

      let locationDetails: { county: string; country: string };
      try {
        locationDetails = await reverseGeocodeCountyCountry(
          location.latitude,
          location.longitude,
        );
      } catch (error) {
        Alert.alert(
          'Location required',
          error instanceof Error
            ? error.message
            : 'Could not determine county and country from your location. Please enable location access and try again.',
        );
        return;
      }

      const { data: insertedStore, error } = await supabase
        .from('stores')
        .insert({
          store_name: storeName.trim(),
          county: locationDetails.county,
          store_lat: location.latitude,
          store_long: location.longitude,
          contact: contact.trim() || null,
          added_by: user.id,
          workspace_id: currentWorkspaceId,
          country: locationDetails.country,
        })
        .select('id')
        .single();

      if (error) throw error;

      const { data: activeProject } = await supabase
        .from('project_plans')
        .select('id, target_stores')
        .eq('workspace_id', currentWorkspaceId)
        .eq('status', 'active')
        .or('is_deleted.eq.false,is_deleted.is.null')
        .limit(1)
        .maybeSingle();

      if (activeProject && insertedStore) {
        const rawStores = activeProject.target_stores;
        const currentStores: string[] = Array.isArray(rawStores)
          ? rawStores.filter((s): s is string => typeof s === 'string')
          : [];
        const storeId = String(insertedStore.id);
        if (!currentStores.includes(storeId)) {
          await supabase
            .from('project_plans')
            .update({ target_stores: [...currentStores, storeId] })
            .eq('id', activeProject.id);
        }
      }

      const addedName = storeName.trim();
      const addedCounty = locationDetails.county;

      if (onSuccess && insertedStore) {
        onSuccess({
          id: String(insertedStore.id),
          name: addedName,
          county: addedCounty,
        });
      } else {
        appAlert('Store added', `${addedName} was added successfully.`);
      }

      setStoreName('');
      setContact('');
      setExpanded(false);
      await onStoreAdded?.();
    } catch (error) {
      Alert.alert(
        'Error adding location',
        error instanceof Error ? error.message : 'Failed to add the new store. Please try again.',
      );
    } finally {
      setSubmitting(false);
      setLocationLoading(false);
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
        <IconChip name="add" backgroundColor={colors.primaryLight} color={colors.primary} />
        <AppText style={{ fontWeight: '600', fontSize: 16, flex: 1, flexShrink: 1 }}>
          Add Store
        </AppText>
      </View>

      {!expanded ? (
        <Button variant="outline" onPress={() => void handleExpand()}>
          Add New Store Location
        </Button>
      ) : (
        <View style={{ gap: spacing.md }}>
          <FormField
            label="Store Name"
            value={storeName}
            onChangeText={setStoreName}
            placeholder="Enter store name"
            autoCapitalize="words"
          />
          <FormField
            label="Contact Number"
            value={contact}
            onChangeText={setContact}
            placeholder="Enter contact number"
            keyboardType="phone-pad"
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              variant="outline"
              onPress={handleCancel}
              disabled={submitting}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              onPress={() => void handleAdd()}
              loading={submitting}
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {locationLoading ? 'Getting location…' : submitting ? 'Adding…' : 'Add Store'}
            </Button>
          </View>
        </View>
      )}
    </Card>
  );
}
