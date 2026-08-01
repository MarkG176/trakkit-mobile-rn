import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@/components/forms/FormField';
import { AppText, Button } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { getCurrentLocation } from '@/utils/location';
import { uploadImageToStorage } from '@/utils/reportImages';
import { colors, hitSlop, radius, spacing } from '@/theme';

type CollectFeedbackFormProps = {
  storeId: string;
  storeName: string;
  onDone: () => void;
  onCancel: () => void;
};

export function CollectFeedbackForm({
  storeId,
  storeName,
  onDone,
  onCancel,
}: CollectFeedbackFormProps) {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [notes, setNotes] = useState('');
  const [uris, setUris] = useState<string[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const next = result.assets.map((a) => a.uri);
    setUris((prev) => [...prev, ...next]);
    setCaptions((prev) => [...prev, ...next.map(() => '')]);
  };

  const removePhoto = (index: number) => {
    setUris((prev) => prev.filter((_, i) => i !== index));
    setCaptions((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!notes.trim() && uris.length === 0) {
      Alert.alert('Missing feedback', 'Add notes or at least one photo.');
      return;
    }
    if (!user || !currentWorkspaceId) {
      Alert.alert('Workspace required', 'Select a workspace first.');
      return;
    }

    setSubmitting(true);
    try {
      const uploadedCaptions: { fileName: string; caption: string }[] = [];
      for (let i = 0; i < uris.length; i++) {
        const fileName = `${storeId}/${Date.now()}-${i}.jpg`;
        const ok = await uploadImageToStorage('store_images', fileName, uris[i]);
        if (!ok) throw new Error('Failed to upload a photo');
        const caption = captions[i]?.trim();
        if (caption) uploadedCaptions.push({ fileName, caption });
      }

      let latitude = 0;
      let longitude = 0;
      try {
        const loc = await getCurrentLocation();
        latitude = loc.latitude;
        longitude = loc.longitude;
      } catch {
        // optional
      }

      if (notes.trim()) {
        await writeWithOfflineQueue('interactions', {
          agent_id: user.id,
          workspace_id: currentWorkspaceId,
          interaction_type: 'engagement',
          store_id: storeId,
          customer_name: storeName,
          outcome: 'completed',
          quantity_sold: 0,
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
          metadata: { feedback_notes: notes.trim() },
          image_metadata:
            uploadedCaptions.length > 0 ? { captions: uploadedCaptions } : null,
        });
      }

      Alert.alert(
        'Feedback submitted',
        `Feedback${uris.length > 0 ? ` and ${uris.length} photo(s)` : ''} recorded for ${storeName}.`,
      );
      setNotes('');
      setUris([]);
      setCaptions([]);
      onDone();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to submit feedback.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={{ maxHeight: 420 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <FormField
        label="Feedback notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Enter feedback about this store..."
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={{ minHeight: 96, height: undefined, paddingVertical: spacing.sm }}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
        {uris.map((uri, index) => (
          <View key={`${uri}-${index}`} style={{ width: 88 }}>
            <View style={{ position: 'relative' }}>
              <Image
                source={{ uri }}
                style={{ width: 88, height: 88, borderRadius: radius.sm }}
              />
              <Pressable
                onPress={() => removePhoto(index)}
                hitSlop={hitSlop}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  borderRadius: 12,
                  padding: 2,
                }}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
            <FormField
              label=""
              value={captions[index] ?? ''}
              onChangeText={(text) =>
                setCaptions((prev) => prev.map((c, i) => (i === index ? text : c)))
              }
              placeholder="Caption"
              containerStyle={{ marginBottom: 0, marginTop: spacing.xs }}
            />
          </View>
        ))}
      </View>

      <Button variant="outline" onPress={() => void pickPhotos()} style={{ marginBottom: spacing.md }}>
        Add Photos
      </Button>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button variant="outline" onPress={onCancel} disabled={submitting} style={{ flex: 1 }}>
          Back
        </Button>
        <Button onPress={() => void submit()} loading={submitting} style={{ flex: 1 }}>
          Submit Feedback
        </Button>
      </View>
    </ScrollView>
  );
}
