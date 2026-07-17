import { useState } from 'react';
import { Alert } from 'react-native';
import { FormField } from '@/components/forms/FormField';
import { GeoCapture } from '@/components/forms/GeoCapture';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { Screen, Button, ChipSelect } from '@/components/ui';

const INTERACTION_TYPES = ['note', 'photo', 'call', 'visit', 'survey', 'sale', 'rejected', 'not_answered'];

export default function LogInteractionScreen() {
  const { user } = useAuth();
  const [interactionType, setInteractionType] = useState('note');
  const [notes, setNotes] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user || !notes || lat == null) {
      Alert.alert('Missing fields', 'Add notes and wait for location.');
      return;
    }

    setLoading(true);
    try {
      const payload = workspaceService.ensureWorkspaceContext({
        agent_id: user.id,
        interaction_type: interactionType,
        interaction_data: { notes },
        latitude: lat,
        longitude: lon,
      });

      const { synced } = await writeWithOfflineQueue('interactions', payload);
      Alert.alert(synced ? 'Interaction logged' : 'Saved offline');
      setNotes('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentGate code="CRM-0096" redirectTo="/(agent)">
      <Screen scroll showBack>
        <ChipSelect
          label="Type"
          value={interactionType}
          onChange={setInteractionType}
          options={INTERACTION_TYPES.map((type) => ({
            value: type,
            label: type.replace(/_/g, ' '),
          }))}
        />
        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={4} />
        <GeoCapture onLocation={(a, b) => { setLat(a); setLon(b); }} />
        <Button onPress={submit} loading={loading}>
          Submit
        </Button>
      </Screen>
    </ComponentGate>
  );
}
