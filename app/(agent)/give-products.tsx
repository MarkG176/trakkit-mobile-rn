import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { FormField } from '@/components/forms/FormField';
import { GeoCapture } from '@/components/forms/GeoCapture';
import { ComponentGate } from '@/components/ComponentGate';
import { GiveawayCartSection } from '@/components/giveaways/GiveawayCartSection';
import {
  ensureLineInCart,
  removeLine,
  totalItems,
  updateLineQuantity,
  type GiveawayLine,
} from '@/components/giveaways/types';
import { ProductPickerSheet } from '@/components/sales/ProductPickerSheet';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { useInventory, type InventoryItem } from '@/hooks/useInventory';
import { Screen, Button, AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function GiveProductsScreen() {
  const { user } = useAuth();
  const { inventory, loading: inventoryLoading } = useInventory();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cart, setCart] = useState<GiveawayLine[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [engagementQuality, setEngagementQuality] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const items = totalItems(cart);
  const canSubmit =
    cart.length > 0 && recipientName.trim().length > 0 && lat != null && lon != null;

  const handleEnsureInCart = (item: InventoryItem) => {
    setCart((prev) => ensureLineInCart(prev, item));
  };

  const submit = async () => {
    if (!user || cart.length === 0 || !recipientName.trim() || lat == null || lon == null) {
      Alert.alert(
        'Missing fields',
        'Add at least one product, enter recipient name, and wait for location.',
      );
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
      const productsGiven = cart.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        product_variant_id: line.product_variant_id,
      }));

      const payload = workspaceService.ensureWorkspaceContext({
        agent_id: user.id,
        recipient_name: recipientName.trim(),
        recipient_phone: recipientPhone.trim() || null,
        products_given: productsGiven,
        total_items: totalItems(cart),
        engagement_quality: engagementQuality.trim() || null,
        location_lat: lat,
        location_lng: lon,
        recorded_at: new Date().toISOString(),
      });

      const { synced } = await writeWithOfflineQueue('giveaways', payload);
      Alert.alert(
        synced ? 'Giveaway recorded' : 'Saved offline',
        synced
          ? items === 1
            ? 'Giveaway submitted successfully.'
            : `${items} items submitted successfully.`
          : 'Will sync when connected.',
      );
      setCart([]);
      setRecipientName('');
      setRecipientPhone('');
      setEngagementQuality('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to record giveaway');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentGate code="CRM-0095" redirectTo="/(agent)">
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
              Build the giveaway list, then complete for this visit.
            </AppText>

            <GiveawayCartSection
              cart={cart}
              onAddProducts={() => setPickerOpen(true)}
              onUpdateQuantity={(id, qty) =>
                setCart((prev) => updateLineQuantity(prev, id, qty))
              }
              onRemove={(id) => setCart((prev) => removeLine(prev, id))}
            />

            <AppText style={{ fontWeight: '700', fontSize: 16, marginBottom: spacing.sm }}>
              Recipient
            </AppText>
            <FormField
              label="Recipient name"
              value={recipientName}
              onChangeText={setRecipientName}
            />
            <FormField
              label="Recipient phone (optional)"
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              keyboardType="phone-pad"
            />
            <FormField
              label="Engagement quality (optional)"
              value={engagementQuality}
              onChangeText={setEngagementQuality}
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
              {`Complete giveaway • ${items} ${items === 1 ? 'item' : 'items'}`}
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
        variant="giveaway"
        onEnsureInCart={handleEnsureInCart}
        onUpdateQuantity={(id, qty) => setCart((prev) => updateLineQuantity(prev, id, qty))}
      />
    </ComponentGate>
  );
}
