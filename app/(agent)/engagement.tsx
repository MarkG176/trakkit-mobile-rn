import { useState } from 'react';
import { Alert, View } from 'react-native';
import { FormField } from '@/components/forms/FormField';
import { SentimentStars } from '@/components/interactions/SentimentStars';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { storeIdPayload, useStoreRouteParams } from '@/hooks/useStoreRouteParams';
import { getCurrentLocation } from '@/utils/location';
import { Screen, Button, AppText, ChipSelect, Card, appAlert } from '@/components/ui';
import { colors, spacing } from '@/theme';

const OPTIONS = [
  { value: 'Demonstration', label: 'Demonstration' },
  { value: 'Taste Test', label: 'Taste Test' },
  { value: 'Product Pitch', label: 'Product Pitch' },
  { value: 'In-person Meeting', label: 'In-person Meeting' },
  { value: 'Follow-up', label: 'Follow-up' },
];

export default function EngagementScreen() {
  const { user } = useAuth();
  const { storeId, storeName } = useStoreRouteParams();
  const [engagementType, setEngagementType] = useState('Demonstration');
  const [notes, setNotes] = useState('');
  const [sentiment, setSentiment] = useState(0);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!engagementType) {
      Alert.alert('Missing type', 'Select an engagement type.');
      return;
    }

    setLoading(true);
    try {
      let latitude: number | null = null;
      let longitude: number | null = null;
      try {
        const loc = await getCurrentLocation();
        latitude = loc.latitude;
        longitude = loc.longitude;
      } catch {
        // optional
      }

      const payload = workspaceService.ensureWorkspaceContext({
        agent_id: user.id,
        interaction_type: 'engagement',
        customer_name: storeName || null,
        outcome: 'completed',
        quantity_sold: 0,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
        metadata: {
          engagement_type: engagementType,
          notes: notes.trim(),
          sentiment,
        },
        ...storeIdPayload(storeId),
      });

      const { synced } = await writeWithOfflineQueue('interactions', payload);
      appAlert(
        synced ? 'Engagement logged' : 'Saved offline',
        synced ? 'Engagement saved successfully.' : 'Will sync when connected.',
      );
      setNotes('');
      setSentiment(0);
      setEngagementType('Demonstration');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to log engagement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentGate code="CRM-0030" redirectTo="/(agent)">
      <Screen scroll showBack>
        <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
          Log a product demo, taste, or pitch.
        </AppText>
        <Card style={{ marginBottom: spacing.md }}>
          <ChipSelect
            label="Engagement Type"
            options={OPTIONS}
            value={engagementType}
            onChange={setEngagementType}
          />
          <FormField
            label="Interaction Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add details about the engagement..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 96, height: undefined, paddingVertical: spacing.sm }}
          />
          <AppText style={{ fontWeight: '500', marginBottom: spacing.sm, color: colors.foreground }}>
            Customer Sentiment
          </AppText>
          <SentimentStars value={sentiment} onChange={setSentiment} />
        </Card>
        <Button onPress={() => void submit()} loading={loading}>
          Save Engagement
        </Button>
      </Screen>
    </ComponentGate>
  );
}
