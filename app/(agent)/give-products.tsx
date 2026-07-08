import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { FormField } from '@/components/forms/FormField';
import { GeoCapture } from '@/components/forms/GeoCapture';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';

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
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Give Products</Text>
        <FormField label="Recipient name" value={recipientName} onChangeText={setRecipientName} />
        <FormField label="Product" value={productName} onChangeText={setProductName} />
        <FormField label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
        <FormField label="Engagement quality (optional)" value={engagementQuality} onChangeText={setEngagementQuality} />
        <GeoCapture onLocation={(a, b) => { setLat(a); setLon(b); }} />
        <TouchableOpacity className="rounded-xl bg-blue-600 py-4" onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-center font-semibold text-white">Submit giveaway</Text>}
        </TouchableOpacity>
      </ScrollView>
    </ComponentGate>
  );
}
