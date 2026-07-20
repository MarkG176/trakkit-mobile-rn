import { useState } from 'react';
import { Alert } from 'react-native';
import { FormField } from '@/components/forms/FormField';
import { GeoCapture } from '@/components/forms/GeoCapture';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { formatCurrencySimple } from '@/utils/currency';
import { Screen, Button, AppText } from '@/components/ui';
import { spacing } from '@/theme';

export default function RecordSaleScreen() {
  const { user } = useAuth();
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const currency = workspaceService.getProjectCurrencyCode();

  const submit = async () => {
    if (!user || !productName || !price || lat == null || lon == null) {
      Alert.alert('Missing fields', 'Fill in product, price, and wait for location.');
      return;
    }

    setLoading(true);
    try {
      const payload = workspaceService.ensureWorkspaceContext({
        agent_id: user.id,
        product_name: productName,
        quantity: parseInt(quantity, 10) || 1,
        unit_price: parseFloat(price),
        total_price: (parseInt(quantity, 10) || 1) * parseFloat(price),
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
      });

      const { synced } = await writeWithOfflineQueue('sale_items', payload);
      Alert.alert(
        synced ? 'Sale recorded' : 'Saved offline',
        synced ? 'Sale submitted successfully.' : 'Will sync when connected.',
      );
      setProductName('');
      setPrice('');
      setCustomerName('');
      setCustomerPhone('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentGate code="CRM-0094" redirectTo="/(agent)">
      <Screen scroll showBack>
        <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.xs }}>
          Record sale
        </AppText>
        <AppText variant="secondary" style={{ marginBottom: spacing.lg }}>
          Capture units sold and amount for this visit.
        </AppText>
        <FormField label="Product" value={productName} onChangeText={setProductName} />
        <FormField label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
        <FormField
          label={`Unit price (${currency})`}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
        {price && quantity ? (
          <AppText variant="secondary" style={{ marginBottom: spacing.lg }}>
            Total: {formatCurrencySimple((parseInt(quantity, 10) || 1) * parseFloat(price || '0'), currency)}
          </AppText>
        ) : null}
        <FormField label="Customer name (optional)" value={customerName} onChangeText={setCustomerName} />
        <FormField label="Customer phone (optional)" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
        <GeoCapture onLocation={(a, b) => { setLat(a); setLon(b); }} />
        <Button onPress={submit} loading={loading}>
          Submit sale
        </Button>
      </Screen>
    </ComponentGate>
  );
}
