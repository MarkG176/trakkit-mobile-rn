import { useState } from 'react';
import { Alert } from 'react-native';
import { FormField } from '@/components/forms/FormField';
import { GeoCapture } from '@/components/forms/GeoCapture';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { Screen, Button, AppText } from '@/components/ui';
import { spacing } from '@/theme';

export default function GiveProductsScreen() {
  const { user } = useAuth();
  const [recipientName, setRecipientName] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [engagementQuality, setEngagementQuality] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user || !recipientName || !productName || lat == null) {
      Alert.alert('Missing fields', 'Fill recipient, product, and wait for location.');
      return;
    }

    setLoading(true);
    try {
      const payload = workspaceService.ensureWorkspaceContext({
        agent_id: user.id,
        recipient_name: recipientName,
        products_given: [{ name: productName, quantity: parseInt(quantity, 10) || 1 }],
        total_items: parseInt(quantity, 10) || 1,
        engagement_quality: engagementQuality || null,
        location_lat: lat,
        location_lng: lon,
        recorded_at: new Date().toISOString(),
      });

      const { synced } = await writeWithOfflineQueue('giveaways', payload);
      Alert.alert(synced ? 'Giveaway recorded' : 'Saved offline');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentGate code="CRM-0095" redirectTo="/(agent)">
      <Screen scroll showBack>
        <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.xs }}>
          Give products
        </AppText>
        <AppText variant="secondary" style={{ marginBottom: spacing.lg }}>
          Record promotional giveaways or samples handed out.
        </AppText>
        <FormField label="Recipient name" value={recipientName} onChangeText={setRecipientName} />
        <FormField label="Product" value={productName} onChangeText={setProductName} />
        <FormField label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
        <FormField label="Engagement quality (optional)" value={engagementQuality} onChangeText={setEngagementQuality} />
        <GeoCapture onLocation={(a, b) => { setLat(a); setLon(b); }} />
        <Button onPress={submit} loading={loading}>
          Submit giveaway
        </Button>
      </Screen>
    </ComponentGate>
  );
}
