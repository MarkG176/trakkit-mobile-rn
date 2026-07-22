import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { FormField } from '@/components/forms/FormField';
import { GeoCapture } from '@/components/forms/GeoCapture';
import { ComponentGate } from '@/components/ComponentGate';
import { ProductPickerSheet } from '@/components/sales/ProductPickerSheet';
import { SaleCartSection } from '@/components/sales/SaleCartSection';
import {
  cartTotal,
  ensureLineInCart,
  getLineTotal,
  removeLine,
  setLineTotal,
  updateLinePrice,
  updateLineQuantity,
  type SaleLine,
} from '@/components/sales/types';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { formatCurrencySimple } from '@/utils/currency';
import { useInventory, type InventoryItem } from '@/hooks/useInventory';
import { Screen, Button, AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function RecordSaleScreen() {
  const { user } = useAuth();
  const { inventory, loading: inventoryLoading } = useInventory();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cart, setCart] = useState<SaleLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const currency = workspaceService.getProjectCurrencyCode();
  const total = cartTotal(cart);
  const canSubmit = cart.length > 0 && lat != null && lon != null;

  const handleEnsureInCart = (item: InventoryItem) => {
    setCart((prev) => ensureLineInCart(prev, item));
  };

  const submit = async () => {
    if (!user || cart.length === 0 || lat == null || lon == null) {
      Alert.alert('Missing fields', 'Add at least one product and wait for location.');
      return;
    }

    const invalid = cart.find((line) => line.quantity < 1 || !Number.isFinite(line.unitPrice));
    if (invalid) {
      Alert.alert('Invalid items', 'Each item needs a quantity and unit price.');
      return;
    }

    const overStock = cart.find(
      (line) => line.quantity > line.amount_issued && line.amount_issued > 0,
    );
    if (overStock) {
      Alert.alert(
        'Stock limit',
        `${overStock.name} only has ${overStock.amount_issued} available.`,
      );
      return;
    }

    setLoading(true);
    try {
      let allSynced = true;
      for (const line of cart) {
        const payload = workspaceService.ensureWorkspaceContext({
          agent_id: user.id,
          product_name: line.name,
          product_variant_id: line.product_variant_id,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          total_price: getLineTotal(line),
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
        });

        const { synced } = await writeWithOfflineQueue('sale_items', payload);
        if (!synced) allSynced = false;
      }

      Alert.alert(
        allSynced ? 'Sale recorded' : 'Saved offline',
        allSynced
          ? cart.length === 1
            ? 'Sale submitted successfully.'
            : `${cart.length} items submitted successfully.`
          : 'Will sync when connected.',
      );
      setCart([]);
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
      <Screen showBack>
        <View style={{ flex: 1, marginHorizontal: -spacing.md, marginBottom: -spacing.md }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: spacing.md,
              paddingBottom: spacing.xl,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AppText variant="secondary" style={{ marginBottom: spacing.lg }}>
              Build the cart, then complete the sale for this visit.
            </AppText>

            <SaleCartSection
              cart={cart}
              currency={currency}
              onAddProducts={() => setPickerOpen(true)}
              onUpdateQuantity={(id, qty) =>
                setCart((prev) => updateLineQuantity(prev, id, qty))
              }
              onUpdatePrice={(id, price) => setCart((prev) => updateLinePrice(prev, id, price))}
              onRemove={(id) => setCart((prev) => removeLine(prev, id))}
            />

            <AppText style={{ fontWeight: '700', fontSize: 16, marginBottom: spacing.sm }}>
              Customer (optional)
            </AppText>
            <FormField
              label="Customer name"
              value={customerName}
              onChangeText={setCustomerName}
            />
            <FormField
              label="Customer phone"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
            />

            <GeoCapture
              onLocation={(a, b) => {
                setLat(a);
                setLon(b);
              }}
            />
          </ScrollView>

          <View
            style={{
              paddingHorizontal: spacing.md,
              paddingTop: spacing.sm,
              paddingBottom: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.canvas,
            }}
          >
            <Button onPress={submit} loading={loading} disabled={!canSubmit}>
              {`Complete Sale • ${formatCurrencySimple(total, currency)}`}
            </Button>
          </View>
        </View>
      </Screen>

      <ProductPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        inventory={inventory}
        inventoryLoading={inventoryLoading}
        cart={cart}
        currency={currency}
        onEnsureInCart={handleEnsureInCart}
        onUpdateQuantity={(id, qty) => setCart((prev) => updateLineQuantity(prev, id, qty))}
        onSetLineTotal={(id, totalValue) =>
          setCart((prev) => setLineTotal(prev, id, totalValue))
        }
      />
    </ComponentGate>
  );
}
