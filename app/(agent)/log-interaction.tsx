import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, Alert, ActivityIndicator, View } from 'react-native';
import { FormField } from '@/components/forms/FormField';
import { GeoCapture } from '@/components/forms/GeoCapture';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';

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
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Log Interaction</Text>
        <Text className="mb-2 text-sm font-medium text-slate-700">Type</Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {INTERACTION_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              className={`rounded-full px-3 py-1 ${interactionType === type ? 'bg-blue-600' : 'bg-slate-100'}`}
              onPress={() => setInteractionType(type)}
            >
              <Text className={`text-xs capitalize ${interactionType === type ? 'text-white' : 'text-slate-700'}`}>
                {type.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={4} />
        <GeoCapture onLocation={(a, b) => { setLat(a); setLon(b); }} />
        <TouchableOpacity className="rounded-xl bg-blue-600 py-4" onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-center font-semibold text-white">Submit</Text>}
        </TouchableOpacity>
      </ScrollView>
    </ComponentGate>
  );
}
